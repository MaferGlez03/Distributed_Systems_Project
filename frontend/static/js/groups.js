import {closeMenu} from './calendar.js';
import {getUserId} from './contacts.js';

const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
window.globalVariable = 'Valor inicial';

// Variables globales
const overlay2 = document.getElementById('overlay2');
const overlay3 = document.getElementById('overlay3');
let activeMenu2 = null; // Para rastrear qué menú está activo en la 2da capa
let activeMenu3 = null; // Para rastrear qué menú está activo en la 3ra capa

// Create Group
document.getElementById('btn_create_group').addEventListener('click', function () {
    // Obtener los valores de los inputs
    const GroupName = document.getElementById('GroupName').value;
    const GroupDescription = document.getElementById('GroupDescription').value;
    const is_hierarchical = document.getElementById('is_hierarchical').checked; // Verificar si está marcado el checkbox
    var data = 0
    
    if(is_hierarchical) {
        data = {
            name: GroupName,
            description: GroupDescription,
            is_hierarchical: true
        };
    } else {
        data = {
            name: GroupName,
            description: GroupDescription,
            is_hierarchical: false
        };
    }

    // Enviar los datos al endpoint
    fetch('http://127.0.0.1:8000/api/groups/', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Error al crear el grupo: ${err.detail || err}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Redirigir al usuario
            closeMenu()
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al crear el grupo');
        });
});

// List Groups
document.getElementById('list_groups').addEventListener('click', function () {
    // Realizar la solicitud GET al endpoint de grupos
    fetch('http://127.0.0.1:8000/api/groups/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`, // Token para autenticación
        },
    })
        .then(response => {
            if (!response.ok) {
                // Manejar errores si la respuesta no es exitosa
                return response.json().then(err => {
                    throw new Error(`Error al obtener grupos: ${err.detail || err}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Mostrar los contactos en la consola o en la UI
            console.log('Grupos obtenidos:', data);

            // Aquí puedes manipular los datos para mostrarlos en la página
            const groupList = document.getElementById('group-list'); // Asegúrate de tener un contenedor en tu HTML con este ID
            groupList.innerHTML = ''; // Limpiar cualquier contenido previo

            data.forEach(group => {
                const Item = document.createElement('li');
                
                // Nombre del grupo
                const nameItem = document.createElement('h5');
                nameItem.textContent = `${group.name}`;

                // Crear el ícono de info
                const infoCircle = document.createElement('i');
                infoCircle.id = 'info_circle'
                infoCircle.setAttribute('data-menu', 'menu7'); // Asociar el ID del grupo
                infoCircle.className = 'fas fa-info-circle openMenu';
                infoCircle.style.paddingLeft = '5px'; // Espacio entre el nombre y el ícono

                // Agregar un evento de clic al ícono
                infoCircle.addEventListener('click', function () {
                    openGroupInfoMenu(group); // Llamar a la función para abrir el menú flotante
                });
                
                // Crear divider
                const divider = document.createElement('hr')
                divider.className = 'sidebar-divider'

                // Agregar elementos a la lista
                Item.appendChild(nameItem)
                nameItem.appendChild(infoCircle);

                // Agregar el elemento de lista al contenedor
                groupList.appendChild(Item);
                groupList.appendChild(divider);
            });
        })
        .catch(error => {
            // Manejar errores
            console.error('Error:', error.message);
            alert('Error al obtener grupos');
        });
});


// List Group Details
function openGroupInfoMenu(group) {
    // menu7 abierto
    const menu = document.getElementById('menu7');
    menu.innerHTML = ''; // Limpiar cualquier contenido previo

    // Nombre del grupo
    const nameItem = document.createElement('h5');
    nameItem.textContent = `${group.name}`;

    // Creador/Admin del grupo
    const admin = document.createElement('p');
    admin.textContent = `Admin: ${searchId(group.created_by)}`;

    // Descripcion del grupo
    const description = document.createElement('p');
    description.textContent = `${group.description}`;

    // Tiene jerarquia?
    const hierarchical = document.createElement('p');
    hierarchical.textContent = ' is hierachical'

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; // Define el tipo como checkbox
    checkbox.checked = group.is_hierarchical; // Marcar/desmarcar según el valor de group.is_hierarchical
    checkbox.disabled = true; // Hacer que no se pueda cambiar su estado

    hierarchical.appendChild(checkbox);

    // Miembros
    const membersList = document.createElement('ul');
    membersList.className = 'get-list'
    // membersList.textContent = 'Members:'
    group.members.forEach(member => {
        const memberList = document.createElement('li');
        memberList.textContent = `Member: ${searchId(member)}`;
        membersList.appendChild(memberList)

        // Icono agenda miembro
        const agendaIconMember = document.createElement('i');
        agendaIconMember.className = 'fas fa-calendar-alt';
        agendaIconMember.style.paddingLeft = '10px';
        agendaIconMember.style.paddingRight = '10px';
        agendaIconMember.addEventListener('click', function () {
            agendaMember(group.id)
        })

        // Icono borrar miembro
        const deleteMember = document.createElement('i');
        deleteMember.className = 'fas fa-trash-alt';
        deleteMember.style.paddingLeft = '10px'; // Espacio entre el nombre y el ícono
        deleteMember.addEventListener('click', function () {
            console.log('group id: ', group.id)
            console.log('member id: ', member)
            deleteMemberFunction(group.id, member); // Llamar a la función para abrir el menú flotante
        });
        memberList.appendChild(agendaIconMember)
        memberList.appendChild(deleteMember)
    })

    // Icono borrar grupo
    const trashIcon = document.createElement('i');
    trashIcon.className = 'fas fa-trash-alt';
    trashIcon.style.paddingLeft = '10px'; // Espacio entre el nombre y el ícono
    trashIcon.addEventListener('click', function () {
        deleteGroupFunction(group.id)
    })

    // Icono agenda grupo
    const agendaIcon = document.createElement('i');
    agendaIcon.className = 'fas fa-calendar-alt';
    agendaIcon.style.paddingLeft = '10px';
    agendaIcon.style.paddingRight = '10px';
    agendaIcon.addEventListener('click', function () {
        agendaGroup(group.id)
    })

    // Div para los iconos inferiores
    const divIcons = document.createElement('div')
    divIcons.style.marginBottom = '15px';
    divIcons.style.marginTop = '15px';
    divIcons.style.width = '90%';
    divIcons.style.display = 'flex';
    divIcons.style.justifyContent = 'space-between';


    // Icono y texto adicionar miembro
    const addMember = document.createElement('i')
    addMember.textContent = 'Add Member'
    addMember.className = 'fas fa-plus';
    addMember.id = 'icon'

    // Icono de abandonar grupo
    const leaveGroup = document.createElement('i')
    leaveGroup.className = 'fas fa-sign-out-alt';
    leaveGroup.id = 'icon'

    // Agregar un evento de clic al icono de addMember
    addMember.addEventListener('click', function () {
        addMemberFunction(group.id); // Llamar a la función para abrir el menú flotante
        closeMenu2();
        closeMenu();
    });

    // Agregar un evento de clic al icono de abandonar grupo
    leaveGroup.addEventListener('click', function () {
        leaveGroupFunction(group.id); // Llamar a la función para abrir el menú flotante
    });
    
    const closeBtn = document.createElement('button')
    closeBtn.className = 'closeMenu2'
    closeBtn.textContent = 'Close'

    menu.appendChild(nameItem)
    nameItem.appendChild(agendaIcon)
    nameItem.appendChild(trashIcon)
    menu.appendChild(admin)
    menu.appendChild(description)
    menu.appendChild(hierarchical)
    menu.appendChild(membersList)
    divIcons.appendChild(addMember)
    divIcons.appendChild(leaveGroup)
    menu.appendChild(divIcons)
    menu.appendChild(closeBtn)

    activeMenu2 = document.getElementById('menu6');

    // Muestra el overlay y el menú flotante correspondiente
    if (menu) {
        overlay2.style.display = 'flex';
        menu.style.display = 'flex';
        activeMenu2 = menu; // Guarda el menú activo
    }

    // Evento para cerrar menús
    overlay2.addEventListener('click', closeMenu2);
    document.querySelectorAll('.closeMenu2').forEach(button => {
        button.addEventListener('click', closeMenu2);
    });
}

function closeMenu2() {
    if (activeMenu2) {
        activeMenu2.style.display = 'none';
        overlay2.style.display = 'none';
        activeMenu2 = null; // Reinicia el menú activo
    }
}

function closeMenu3() {
    if (activeMenu3) {
        activeMenu3.style.display = 'none';
        overlay3.style.display = 'none';
        activeMenu3 = null; // Reinicia el menú activo
    }
}

function searchId(created_by) {
    return created_by
}

function addMemberFunction(id) {
    // closeMenu()
    const menu = document.getElementById('menu8');


    fetch('http://127.0.0.1:8000/api/contacts/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`, // Token para autenticación
        },
    })
        .then(response => {
            if (!response.ok) {
                // Manejar errores si la respuesta no es exitosa
                return response.json().then(err => {
                    throw new Error(`Error al obtener contactos: ${err.detail || err}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Mostrar los contactos en la consola o en la UI
            console.log('Contactos obtenidos:', data);

            // Aquí puedes manipular los datos para mostrarlos en la página
            const contactList = document.getElementById('contact-list-member'); // Asegúrate de tener un contenedor en tu HTML con este ID
            contactList.innerHTML = ''; // Limpiar cualquier contenido previo

            data.forEach(contact => {
                const listItem = document.createElement('li');
                listItem.textContent = `${contact.contact_name}`;

                // Crear el ícono de basura
                const addMemberIcon = document.createElement('i');
                addMemberIcon.className = 'fas fa-plus';
                addMemberIcon.id = 'icon'
                addMemberIcon.style.marginBottom = '15px';
                addMemberIcon.style.marginLeft = '15px';

                addMemberIcon.addEventListener('click', function () {
                    addMemberEndpoint(id, contact)
                })

                // Agregar el ícono al elemento de lista
                listItem.appendChild(addMemberIcon);

                // Agregar el elemento de lista al contenedor
                contactList.appendChild(listItem);
            });
        })
        .catch(error => {
            // Manejar errores
            console.error('Error:', error.message);
            alert('Hubo un error al obtener los contactos');
        });


    activeMenu3 = document.getElementById('menu7');

    // Muestra el overlay y el menú flotante correspondiente
    if (menu) {
        overlay3.style.display = 'flex';
        menu.style.display = 'flex';
        activeMenu3 = menu; // Guarda el menú activo
    }

    // Evento para cerrar menús
    overlay3.addEventListener('click', closeMenu3);
    document.querySelectorAll('.closeMenu3').forEach(button => {
        button.addEventListener('click', closeMenu3);
    });
}

function addMemberEndpoint(id, contact) {
    getUserId(contact.contact_name, contact.contact_email)
        .then(idUser => {
            const memberData = {
                group_id: id,
                user_id: idUser
            }
            fetch('http://127.0.0.1:8000/api/groups/add-member/', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify(memberData),
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(`Error al adicionar miembro: ${err.detail || err}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    // Redirigir al usuario
                    closeMenu3()
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Hubo un error al adicionar miembro');
                });
        })
        .catch(error => {
            console.error('Error al obtener el ID', error)
        })
}

// Delete Members
function deleteMemberFunction(groupId, memberId) {
    fetch(`http://127.0.0.1:8000/api/groups/${groupId}/remove-member/${memberId}/`, {
        method: 'DELETE', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Error al eliminar miembro: ${err.detail || err}`);
                });
            }
            // Verificar si hay contenido en la respuesta antes de procesarla
            if (response.status !== 204) { // 204 significa No Content
                return response.json();
            }
            return null; // No hay contenido para procesar
        })
        .then(data => {
            // Redirigir al usuario
            if (data) {
                console.log('Respuesta del servidor:', data);
            }
            closeMenu2()
            closeMenu()
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al adicionar miembro');
        });
}

function deleteGroupFunction(groupId) {
    fetch(`http://127.0.0.1:8000/api/groups/${groupId}/delete/`, {
        method: 'DELETE', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Error al eliminar grupo: ${err.detail || err}`);
                });
            }
            // Verificar si hay contenido en la respuesta antes de procesarla
            if (response.status !== 204) { // 204 significa No Content
                return response.json();
            }
            return null; // No hay contenido para procesar
        })
        .then(data => {
            // Redirigir al usuario
            if (data) {
                console.log('Respuesta del servidor:', data);
            }
            closeMenu2()
            closeMenu()
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al eliminar grupo');
        });
}

function leaveGroupFunction(groupId) {
    fetch(`http://127.0.0.1:8000/api/groups/${groupId}/leave/`, {
        method: 'DELETE', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                console.log('response', response.json())
                return response.json().then(err => {
                    throw new Error(`Error al abandonar grupo: ${err.detail || err}`);
                });
            }
            // Verificar si hay contenido en la respuesta antes de procesarla
            if (response.status !== 204) { // 204 significa No Content
                return response.json();
            }
            return null; // No hay contenido para procesar
        })
        .then(data => {
            // Redirigir al usuario
            if (data) {
                console.log('Respuesta del servidor:', data);
            }
            closeMenu2()
            closeMenu()
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al abandonar grupo');
        });
}

function agendaGroup(groupID) {
    fetch(`http://127.0.0.1:8000/api/groups/${groupID}/agendas`, {
        method: 'GET', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Error al consultar la agenda: ${err.detail || err}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Redirigir al usuario
            closeMenu()
            closeMenu2()
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al consultar la agenda');
        });
}

function agendaMember() {
    fetch(`http://127.0.0.1:8000/api//agendas`, {
        method: 'GET', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Error al consultar la agenda: ${err.detail || err}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Redirigir al usuario
            closeMenu()
            closeMenu2()
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al consultar la agenda');
        });
}