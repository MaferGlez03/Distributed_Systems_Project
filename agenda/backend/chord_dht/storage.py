from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# Configurar la base de datos SQLite
engine = create_engine('sqlite:///agenda.db', echo=True)  # echo=True para ver las consultas SQL en la consola
Base = declarative_base()

# Definir las tablas como clases
class UserAgenda(Base):
    __tablename__ = 'user_agenda'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    event_id = Column(Integer, ForeignKey('events.id'), nullable=False)
    user = relationship('User', back_populates='agenda')
    event = relationship('Event', back_populates='agenda_users')
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)  # Usamos email en lugar de número
    password_hash = Column(String, nullable=False)  # Contraseña hasheada
    contacts = relationship('Contact', back_populates='user')
    events = relationship('Event', back_populates='owner')
    groups = relationship('Group', back_populates='owner')
    agenda = relationship('UserAgenda', back_populates='user')

    def set_password(self, password: str):
        """
        Hashea la contraseña antes de almacenarla.
        """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """
        Verifica si la contraseña es correcta.
        """
        return check_password_hash(self.password_hash, password)

class Contact(Base):
    __tablename__ = 'contacts'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    contact_name = Column(String, nullable=False)
    user = relationship('User', back_populates='contacts')

class Event(Base):
    __tablename__ = 'events'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Dueño del evento
    privacy = Column(Enum('public', 'private', 'group', name='privacy_types'), nullable=False)
    group_id = Column(Integer, ForeignKey('groups.id'))  # Grupo asociado (si es grupal)
    status = Column(Enum('pending', 'confirmed', 'canceled', name='status_types'), nullable=False)
    owner = relationship('User', back_populates='events')
    group = relationship('Group', back_populates='events')
    agenda_users = relationship('UserAgenda', back_populates='event')

class Group(Base):
    __tablename__ = 'groups'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    owner = relationship('User', back_populates='groups')
    members = relationship('GroupMember', back_populates='group')
    events = relationship('Event', back_populates='group')

class GroupMember(Base):
    __tablename__ = 'group_members'
    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey('groups.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    role = Column(Enum('admin', 'member', name='role_types'), nullable=False, default='member')  # Rol del miembro
    group = relationship('Group', back_populates='members')
    user = relationship('User')

# Crear las tablas en la base de datos
Base.metadata.create_all(engine)

# Configurar la sesión
Session = sessionmaker(bind=engine)
session = Session()

# Clase Database para manejar las operaciones
class Database:
    def __init__(self):
        self.session = Session()

    def close(self):
        """
        Cierra la sesión de la base de datos.
        """
        self.session.close()

    # Métodos para usuarios
    def register_user(self, name: str, email: str, password: str) -> bool:
        """
        Registra un nuevo usuario con contraseña segura.
        """
        user = User(name=name, email=email)
        user.set_password(password)
        self.session.add(user)
        try:
            self.session.commit()
            return True
        except:
            self.session.rollback()
            return False  # El email ya está registrado

    def login_user(self, email: str, password: str) -> dict:
        """
        Inicia sesión de un usuario con autenticación segura.
        """
        user = self.session.query(User).filter_by(email=email).first()
        if user and user.check_password(password):
            return {'id': user.id, 'name': user.name}
        return None

    # Métodos para contactos
    def add_contact(self, user_id: int, contact_name: str) -> bool:
        """
        Agrega un contacto a un usuario.
        """
        contact = Contact(user_id=user_id, contact_name=contact_name)
        self.session.add(contact)
        try:
            self.session.commit()
            return True
        except:
            self.session.rollback()
            return False  # El contacto ya existe

    def list_contacts(self, user_id: int) -> list:
        """
        Lista los contactos de un usuario.
        """
        contacts = self.session.query(Contact).filter_by(user_id=user_id).all()
        return [contact.contact_name for contact in contacts]

    # Métodos para eventos
    def create_event(self, name: str, date: str, owner_id: int, privacy: str, group_id=None) -> bool:
        """
        Crea un nuevo evento.
        """
        event = Event(
            name=name,
            date=datetime.strptime(date, '%Y-%m-%d'),
            owner_id=owner_id,
            privacy=privacy,
            group_id=group_id,
            status='pending'
        )
        self.session.add(event)
        try:
            self.session.commit()
            return True
        except:
            self.session.rollback()
            return False  # Error al crear el evento

    def create_group_event(self, name: str, date: str, owner_id: int, group_id: int) -> bool:
        """
        Crea un evento grupal. Si el dueño es admin, se añade automáticamente a las agendas de los miembros.
        """
        # Verificar si el dueño es admin del grupo
        is_admin = self.session.query(GroupMember).filter_by(
            group_id=group_id, user_id=owner_id, role='admin'
        ).first() is not None

        # Crear el evento
        event = Event(
            name=name,
            date=datetime.strptime(date, '%Y-%m-%d'),
            owner_id=owner_id,
            privacy='group',
            group_id=group_id,
            status='confirmed' if is_admin else 'pending'  # Confirmado si es admin
        )
        self.session.add(event)
        self.session.commit()

        # Si es admin, añadir el evento a las agendas de los miembros
        if is_admin:
            members = self.session.query(GroupMember).filter_by(group_id=group_id).all()
            for member in members:
                if not self._has_event_conflict(member.user_id, event.date):
                    self._add_event_to_agenda(member.user_id, event.id)

        return True

    def create_individual_event(self, name: str, date: str, owner_id: int, contact_id: int) -> bool:
        """
        Crea un evento individual con un contacto.
        """
        event = Event(
            name=name,
            date=datetime.strptime(date, '%Y-%m-%d'),
            owner_id=owner_id,
            privacy='private',
            status='pending'
        )
        self.session.add(event)
        self.session.commit()

        # Añadir el evento a la agenda del contacto
        self._add_event_to_agenda(contact_id, event.id)
        return True

    def confirm_event(self, event_id: int) -> bool:
        """
        Confirma un evento.
        """
        event = self.session.query(Event).filter_by(id=event_id).first()
        if event:
            event.status = 'confirmed'
            self.session.commit()
            return True
        return False

    def cancel_event(self, event_id: int) -> bool:
        """
        Cancela un evento.
        """
        event = self.session.query(Event).filter_by(id=event_id).first()
        if event:
            event.status = 'canceled'
            self.session.commit()
            return True
        return False

    def list_events(self, user_id: int) -> list:
        """
        Lista los eventos de un usuario (personales y grupales).
        """
        events = self.session.query(Event).filter(
            (Event.owner_id == user_id) | (Event.group_id.in_(
                self.session.query(GroupMember.group_id).filter_by(user_id=user_id)
            ))
        ).all()
        return events

    # Métodos para grupos
    def create_group(self, name: str, owner_id: int) -> bool:
        """
        Crea un nuevo grupo.
        """
        group = Group(name=name, owner_id=owner_id)
        self.session.add(group)
        try:
            self.session.commit()
            return True
        except:
            self.session.rollback()
            return False  # El grupo ya existe

    def add_member_to_group(self, group_id: int, user_id: int, role: str = 'member') -> bool:
        """
        Agrega un miembro a un grupo.
        """
        member = GroupMember(group_id=group_id, user_id=user_id, role=role)
        self.session.add(member)
        try:
            self.session.commit()
            return True
        except:
            self.session.rollback()
            return False  # El usuario ya está en el grupo
        
    def remove_member_from_group(self, group_id: int, user_id: int) -> bool:
        """
        Elimina un miembro de un grupo.
        """
        member = self.session.query(GroupMember).filter_by(group_id=group_id, user_id=user_id).first()
        if member:
            self.session.delete(member)
            self.session.commit()
            return True
        return False  # El miembro no existe en el grupo

    def list_groups(self, user_id: int) -> list:
        """
        Lista los grupos de un usuario.
        """
        groups = self.session.query(Group).join(GroupMember).filter(GroupMember.user_id == user_id).all()
        return [(group.id, group.name) for group in groups]

    # Métodos auxiliares
    def _has_event_conflict(self, user_id: int, event_date: datetime) -> bool:
        """
        Verifica si un usuario tiene un evento en la misma fecha.
        """
        return self.session.query(Event).filter(
            (Event.owner_id == user_id) & (Event.date == event_date)
        ).first() is not None

    def _add_event_to_agenda(self, user_id: int, event_id: int) -> bool:
        """
        Añade un evento a la agenda de un usuario.
        """
        # Verificar si el evento ya está en la agenda del usuario
        existing_entry = self.session.query(UserAgenda).filter_by(user_id=user_id, event_id=event_id).first()
        if existing_entry:
            return False  # El evento ya está en la agenda

        # Añadir el evento a la agenda del usuario
        agenda_entry = UserAgenda(user_id=user_id, event_id=event_id)
        self.session.add(agenda_entry)
        self.session.commit()
        return True