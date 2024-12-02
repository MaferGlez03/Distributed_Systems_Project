import { dailyEvents } from "./event.js";

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const day = document.querySelector(".calendar-dates");
const currdate = document.querySelector(".calendar-current-date");
const prenexIcons = document.querySelectorAll(".calendar-navigation");

// Array of month names
const months = [
    "January", "February", "March", "April", "May",
    "June", "July", "August", "September", "October",
    "November", "December"
];

// Function to generate the calendar
export const manipulate = () => {

    // Get the first day of the month
    let dayone = new Date(year, month, 1).getDay();

    // Get the last date of the month
    let lastdate = new Date(year, month + 1, 0).getDate();

    // Get the day of the last date of the month
    let dayend = new Date(year, month, lastdate).getDay();

    // Get the last date of the previous month
    let monthlastdate = new Date(year, month, 0).getDate();

    // Variable to store the generated calendar HTML
    let lit = "";

    // Loop to add the last dates of the previous month
    for (let i = dayone; i > 0; i--) {
        lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
    }

    // Loop to add the dates of the current month
    for (let i = 1; i <= lastdate; i++) {
        // Check if the current date is today
        let isToday = i === date.getDate()
            && month === new Date().getMonth()
            && year === new Date().getFullYear()
            ? "active"
            : "";
            
        // Comprobar si la fecha tiene eventos
        let dayI = i < 10 ? `0${i}` : i;

        let listItem = `<li class="${isToday}" id="day-${year}-${month + 1}-${dayI}">${i}`;

        // Consultar eventos para la fecha actual
        dailyEvents(`${year}-${month + 1}-${dayI}`)
            .then(({ personalEvents }) => {
                // Crear una variable para almacenar los eventos
                let eventsHTML = "";

                // Recorrer los eventos personales y agregar un <p> por evento
                personalEvents.forEach(event => {
                    eventsHTML += `<p class="event-title">${event.title}</p>`;
                });

                // Completar el contenido del <li> con los eventos
                document.querySelector(`#day-${year}-${month + 1}-${dayI}`).innerHTML += eventsHTML;
            })
            .catch(error => {
                console.error('Error:', error.message);
            });

        // Finalizar el <li> y agregarlo al calendario
        lit += `${listItem}</li>`;
    }

    // Loop to add the first dates of the next month
    for (let i = dayend; i < 6; i++) {
        lit += `<li class="inactive">${i - dayend + 1}</li>`
    }

    // Update the text of the current date element 
    // with the formatted current month and year
    currdate.innerText = `${months[month]} ${year}`;

    // update the HTML of the dates element 
    // with the generated calendar
    day.innerHTML = lit;
}

manipulate();

// Attach a click event listener to each icon
prenexIcons.forEach(icon => {

    // When an icon is clicked
    icon.addEventListener("click", () => {

        // Check if the icon is "calendar-prev"
        // or "calendar-next"
        month = icon.id === "calendar-prev" ? month - 1 : month + 1;

        // Check if the month is out of range
        if (month < 0 || month > 11) {

            // Set the date to the first day of the 
            // month with the new year
            date = new Date(year, month, new Date().getDate());

            // Set the year to the new year
            year = date.getFullYear();

            // Set the month to the new month
            month = date.getMonth();
        }

        else {

            // Set the date to the current date
            date = new Date();
        }

        // Call the manipulate function to 
        // update the calendar display
        manipulate();
    });
});

// Variables globales
const overlay = document.getElementById('overlay');
let activeMenu = null; // Para rastrear qué menú está activo

// Evento para abrir menús flotantes
document.querySelectorAll('.openMenu').forEach(button => {
    button.addEventListener('click', function (event) {
        event.preventDefault(); // Previene el comportamiento predeterminado del enlace

        // Identifica el menú a abrir
        const menuId = this.getAttribute('data-menu');
        const menu = document.getElementById(menuId);

        // Muestra el overlay y el menú flotante correspondiente
        if (menu) {
            overlay.style.display = 'flex';
            menu.style.display = 'flex';
            activeMenu = menu; // Guarda el menú activo
        }
    });
});

// Evento para cerrar menús
overlay.addEventListener('click', closeMenu);
document.querySelectorAll('.closeMenu').forEach(button => {
    button.addEventListener('click', closeMenu);
});

// Función para cerrar el menú flotante activo
export function closeMenu() {
    if (activeMenu) {
        activeMenu.style.display = 'none';
        overlay.style.display = 'none';
        activeMenu = null; // Reinicia el menú activo
    }
}