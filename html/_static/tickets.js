// ==UserScript==
// @name         Add Columns to OTRS Table with Descriptions and Links
// @namespace    http://tampermonkey.net/
// @version      2.16
// @description  Add two new columns to OTRS table and fill them with fixed descriptions and links. Editable notes saved to SQLite DB. Show additional information in the ticket details view.
// @author       You
// @match        *://*192.168.10.201/otrs/*
// @match        *://*192.168.10.201/otrs/index.pl?OTRSAgentInterface=*
// @grant        none
// @run-at       document-start
// @updateURL    http://192.168.21.188:1337/myscript.user.js
// @downloadURL  http://192.168.21.188:1337/myscript.user.js
// ==/UserScript==

(function() {
    'use strict';

    const API_URL = 'http://192.168.21.130:5000/api/tickets';
    let descriptions = {};
    let ticketDetailsLoaded = false;

    // Fetch data from the server
    async function fetchData() {
        console.log("Fetching data from server...");
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            descriptions = data.reduce((acc, [Ticket, Note, Link, Timestamp]) => {
                acc[Ticket] = { description: Note, description2: Link ? Link : '', timestamp: Timestamp ? Timestamp : '' };
                return acc;
            }, {});
            console.log("Data fetched successfully:", descriptions);
            checkAndAddColumns();
            if (window.location.href.includes("Action=AgentTicketZoom")) {
                loadTicketDetails();
            }
        } catch (error) {
            console.error("Error fetching data from server:", error);
        }
    }

    // Update data on the server
    async function updateData(ticketNumber, note, link, timestamp) {
        console.log(`Updating data for ticket ${ticketNumber}...`);
        try {
            await fetch(`${API_URL}/${ticketNumber}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Note: note, Link: link, Timestamp: timestamp })
            });
            console.log(`Data for ticket ${ticketNumber} updated successfully.`);
        } catch (error) {
            console.error(`Error updating data for ticket ${ticketNumber}:`, error);
        }
    }

    // Get current timestamp
    function getCurrentTimestamp() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${day}.${month} ${hours}:${minutes}`;
    }

    // Check if we are on the correct page
    function init() {
        console.log("Initializing script...");
        if (window.location.href.includes("Action=AgentDashboard") || window.location.href.includes("OTRSAgentInterface=") || window.location.href.includes("Action=AgentTicketZoom")) {
            fetchData();
            observeDOMChanges();
        }
    }

    // Function to add columns to the dashboard
    function addColumns() {
        console.log("Adding columns to the dashboard...");
        let tableContainer = document.querySelector('#Dashboard0130-TicketOpen');
        if (!tableContainer) {
            console.log("Dashboard ticket table container not found.");
            return false;
        }

        let table = tableContainer.querySelector('.DataTable');
        if (!table) {
            console.log("Dashboard ticket table not found.");
            return false;
        }

        if (table.querySelector('th.new-column1') && table.querySelector('th.new-column2')) {
            console.log("Columns already added.");
            return true;
        }

        let thead = table.querySelector('thead');
        if (!thead) {
            thead = document.createElement('thead');
            table.insertBefore(thead, table.firstChild);
        }

        let headerRow = thead.querySelector('tr');
        if (!headerRow) {
            headerRow = document.createElement('tr');
            thead.appendChild(headerRow);
        }

        let newHeader1 = document.createElement('th');
        newHeader1.className = 'DashboardHeader new-column1';
        newHeader1.innerText = 'Заметка';
        newHeader1.style.textAlign = 'center';
        headerRow.appendChild(newHeader1);

        let newHeader2 = document.createElement('th');
        newHeader2.className = 'DashboardHeader new-column2';
        newHeader2.innerText = 'Эвентус';
        newHeader2.style.textAlign = 'center';
        headerRow.appendChild(newHeader2);

        let rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            let ticketNumber = row.querySelector('td:nth-child(3) a').innerText;

            let newCell1 = document.createElement('td');
            newCell1.className = 'new-column1';
            let timestamp = descriptions[ticketNumber] && descriptions[ticketNumber].timestamp ? descriptions[ticketNumber].timestamp : '';
            newCell1.innerHTML = descriptions[ticketNumber] && descriptions[ticketNumber].description
                ? `<div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span style="flex-shrink: 0; margin-right: 5px;">${timestamp}</span><span class="note-text" style="flex-grow: 1; text-align: left;">${descriptions[ticketNumber].description}</span><button class="edit-note-btn" style="width: 30px; height: 30px;">...</button></div>`
                : '<div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span style="flex-grow: 1;"></span><button class="edit-note-btn" style="width: 30px; height: 30px;">+</button></div>';
            newCell1.style.pointerEvents = 'none';
            newCell1.querySelector('.edit-note-btn').style.pointerEvents = 'all';
            row.appendChild(newCell1);

            let newCell2 = document.createElement('td');
            newCell2.className = 'new-column2';
            newCell2.innerHTML = descriptions[ticketNumber] && descriptions[ticketNumber].description2
                ? `<div style="display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer;" class="eventus-cell"><a href="${descriptions[ticketNumber].description2}" target="_blank" class="external-link" style="flex-grow: 1; text-align: center;">Ссылка</a> <button class="edit-link-btn" style="width: 30px; height: 30px;">...</button></div>`
                : '<div style="display: flex; justify-content: flex-end; align-items: center; width: 100%; cursor: pointer;" class="eventus-cell"><button class="edit-link-btn" style="width: 30px; height: 30px;">+</button></div>';
            row.appendChild(newCell2);

            newCell2.addEventListener('click', function(event) {
                if (event.target.tagName !== 'BUTTON') {
                    event.stopPropagation();
                    if (event.target.tagName !== 'A') {
                        window.open(newCell2.querySelector('.external-link').href, '_blank');
                    }
                }
            });
        });

        document.querySelectorAll('.edit-note-btn').forEach(btn => {
            btn.addEventListener('click', function(event) {
                console.log("Edit note button clicked.");
                event.preventDefault();
                event.stopPropagation();
                let ticketNumber = this.closest('tr').querySelector('td:nth-child(3) a').innerText;
                console.log(`Ticket number: ${ticketNumber}`);
                let currentNote = descriptions[ticketNumber] ? descriptions[ticketNumber].description : '';
                console.log(`Current note: ${currentNote}`);
                let newNote = prompt("Введите новую заметку:", currentNote);
                if (newNote !== null) {
                    console.log(`New note: ${newNote}`);
                    if (!descriptions[ticketNumber]) descriptions[ticketNumber] = {};
                    let timestamp = getCurrentTimestamp();
                    descriptions[ticketNumber].description = newNote;
                    descriptions[ticketNumber].timestamp = timestamp;
                    let td = this.closest('td');
                    td.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span style="flex-shrink: 0; margin-right: 5px;">${timestamp}</span><span class="note-text" style="flex-grow: 1; text-align: left;">${newNote}</span><button class="edit-note-btn" style="width: 30px; height: 30px; pointer-events: all;">...</button></div>`;
                    updateData(ticketNumber, newNote, descriptions[ticketNumber].description2, timestamp);
                    attachNoteEditHandler(td.querySelector('.edit-note-btn'));
                } else {
                    console.log("Edit note cancelled.");
                }
            });
        });

        document.querySelectorAll('.edit-link-btn').forEach(btn => {
            btn.addEventListener('click', function(event) {
                console.log("Edit link button clicked.");
                event.preventDefault();
                event.stopPropagation();
                let ticketNumber = this.closest('tr').querySelector('td:nth-child(3) a').innerText;
                console.log(`Ticket number: ${ticketNumber}`);
                let currentLink = descriptions[ticketNumber] ? descriptions[ticketNumber].description2 : '';
                console.log(`Current link: ${currentLink}`);
                let newLink = prompt("Введите новую ссылку:", currentLink);
                if (newLink !== null) {
                    console.log(`New link: ${newLink}`);
                    if (!descriptions[ticketNumber]) descriptions[ticketNumber] = {};
                    descriptions[ticketNumber].description2 = newLink;
                    let td = this.closest('td');
                    td.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer;" class="eventus-cell"><a href="${newLink}" target="_blank" class="external-link" style="flex-grow: 1; text-align: center;">Ссылка</a> <button class="edit-link-btn" style="width: 30px; height: 30px; pointer-events: all;">...</button></div>`;
                    updateData(ticketNumber, descriptions[ticketNumber].description, newLink, descriptions[ticketNumber].timestamp);
                    attachLinkEditHandler(td.querySelector('.edit-link-btn'));
                } else {
                    console.log("Edit link cancelled.");
                }
            });
        });

        return true;
    }

    // Function to check and add columns
    function checkAndAddColumns() {
        console.log("Checking and adding columns...");
        let tableContainer = document.querySelector('#Dashboard0130-TicketOpen');
        let table = tableContainer ? tableContainer.querySelector('.DataTable') : null;
        if (table) {
            let columnsExist = table.querySelector('th.new-column1') && table.querySelector('th.new-column2');
            if (!columnsExist) {
                addColumns();
            }
        }
    }

    // Function to observe DOM changes
    function observeDOMChanges() {
        console.log("Observing DOM changes...");
        const observer = new MutationObserver((mutations, obs) => {
            checkAndAddColumns();
            if (window.location.href.includes("Action=AgentTicketZoom") && !ticketDetailsLoaded) {
                loadTicketDetails();
            }
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });

        const intervalId = setInterval(() => {
            checkAndAddColumns();
            if (window.location.href.includes("Action=AgentTicketZoom") && !ticketDetailsLoaded) {
                loadTicketDetails();
            }
        }, 5000);

        setTimeout(() => {
            clearInterval(intervalId);
            observer.disconnect();
        }, 600000); // 10 minutes
    }

    // Function to attach edit note handler
    function attachNoteEditHandler(btn) {
        btn.addEventListener('click', function(event) {
            console.log("Reattached edit note button clicked.");
            event.preventDefault();
            event.stopPropagation();
            let ticketNumber = this.closest('tr').querySelector('td:nth-child(3) a').innerText;
            console.log(`Ticket number: ${ticketNumber}`);
            let currentNote = descriptions[ticketNumber] ? descriptions[ticketNumber].description : '';
            console.log(`Current note: ${currentNote}`);
            let newNote = prompt("Введите новую заметку:", currentNote);
            if (newNote !== null) {
                console.log(`New note: ${newNote}`);
                if (!descriptions[ticketNumber]) descriptions[ticketNumber] = {};
                let timestamp = getCurrentTimestamp();
                descriptions[ticketNumber].description = newNote;
                descriptions[ticketNumber].timestamp = timestamp;
                let td = this.closest('td');
                td.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span style="flex-shrink: 0; margin-right: 5px;">${timestamp}</span><span class="note-text" style="flex-grow: 1; text-align: left;">${newNote}</span><button class="edit-note-btn" style="width: 30px; height: 30px; pointer-events: all;">...</button></div>`;
                updateData(ticketNumber, newNote, descriptions[ticketNumber].description2, timestamp);
                attachNoteEditHandler(td.querySelector('.edit-note-btn'));
            } else {
                console.log("Edit note cancelled.");
            }
        });
    }

    // Function to attach edit link handler
    function attachLinkEditHandler(btn) {
        btn.addEventListener('click', function(event) {
            console.log("Reattached edit link button clicked.");
            event.preventDefault();
            event.stopPropagation();
            let ticketNumber = this.closest('tr').querySelector('td:nth-child(3) a').innerText;
            console.log(`Ticket number: ${ticketNumber}`);
            let currentLink = descriptions[ticketNumber] ? descriptions[ticketNumber].description2 : '';
            console.log(`Current link: ${currentLink}`);
            let newLink = prompt("Введите новую ссылку:", currentLink);
            if (newLink !== null) {
                console.log(`New link: ${newLink}`);
                if (!descriptions[ticketNumber]) descriptions[ticketNumber] = {};
                descriptions[ticketNumber].description2 = newLink;
                let td = this.closest('td');
                td.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer;" class="eventus-cell"><a href="${newLink}" target="_blank" class="external-link" style="flex-grow: 1; text-align: center;">Ссылка</a> <button class="edit-link-btn" style="width: 30px; height: 30px; pointer-events: all;">...</button></div>`;
                updateData(ticketNumber, descriptions[ticketNumber].description, newLink, descriptions[ticketNumber].timestamp);
                attachLinkEditHandler(td.querySelector('.edit-link-btn'));
            } else {
                console.log("Edit link cancelled.");
            }
        });
    }

    // Function to load ticket details in the ticket view page
    function loadTicketDetails() {
        console.log("Loading ticket details...");
        const ticketIdElem = document.querySelector('h1[title^="Подробно Ticket#"]');
        if (!ticketIdElem) {
            console.log("Ticket ID element not found.");
            return;
        }

        const ticketNumber = ticketIdElem.innerText.match(/Ticket#(\d+)/)[1];
        if (!ticketNumber) {
            console.log(`No ticket number found in the title.`);
            return;
        }

        const sidebar = document.querySelector('.SidebarColumn');
        if (!sidebar) {
            console.log("Sidebar column not found.");
            return;
        }

        const widget = document.createElement('div');
        widget.className = 'WidgetSimple';
        widget.innerHTML = `
            <div class="Header">
                <h2>Дополнительная информация</h2>
            </div>
            <div class="Content">
                <fieldset class="TableLike FixedLabelSmall Narrow">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label>Заметка:</label>
                        <p class="Value" id="note-value">${descriptions[ticketNumber] ? descriptions[ticketNumber].description || '' : ''}</p>
                        <button id="edit-note-btn" style="width: 30px; height: 30px;">...</button>
                    </div>
                    <div class="Clear"></div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label>Эвентус:</label>
                        <p class="Value" id="eventus-value">${descriptions[ticketNumber] && descriptions[ticketNumber].description2 ? `<a href="${descriptions[ticketNumber].description2}" target="_blank">Ссылка</a>` : ''}</p>
                        <button id="edit-eventus-btn" style="width: 30px; height: 30px;">...</button>
                    </div>
                    <div class="Clear"></div>
                </fieldset>
            </div>
        `;
        sidebar.appendChild(widget);
        console.log("Ticket details loaded successfully.");
        ticketDetailsLoaded = true;

        document.getElementById('edit-note-btn').addEventListener('click', function(event) {
            console.log("Sidebar edit note button clicked.");
            event.preventDefault();
            event.stopPropagation();
            let currentNote = descriptions[ticketNumber] ? descriptions[ticketNumber].description : '';
            let newNote = prompt("Введите новую заметку:", currentNote);
            if (newNote !== null) {
                if (!descriptions[ticketNumber]) descriptions[ticketNumber] = {};
                let timestamp = getCurrentTimestamp();
                descriptions[ticketNumber].description = newNote;
                descriptions[ticketNumber].timestamp = timestamp;
                document.getElementById('note-value').innerText = newNote;
                updateData(ticketNumber, newNote, descriptions[ticketNumber].description2, timestamp);
            } else {
                console.log("Edit note cancelled.");
            }
        });

        document.getElementById('edit-eventus-btn').addEventListener('click', function(event) {
            console.log("Sidebar edit eventus button clicked.");
            event.preventDefault();
            event.stopPropagation();
            let currentLink = descriptions[ticketNumber] ? descriptions[ticketNumber].description2 : '';
            let newLink = prompt("Введите новую ссылку:", currentLink);
            if (newLink !== null) {
                if (!descriptions[ticketNumber]) descriptions[ticketNumber] = {};
                descriptions[ticketNumber].description2 = newLink;
                document.getElementById('eventus-value').innerHTML = `<a href="${newLink}" target="_blank">Ссылка</a>`;
                updateData(ticketNumber, descriptions[ticketNumber].description, newLink, descriptions[ticketNumber].timestamp);
            } else {
                console.log("Edit eventus cancelled.");
            }
        });
    }

    // Run the script as early as possible
    window.addEventListener('load', init);
})();
