const items= [
    "Regular bed frames",
    "Bunk Bed frames",
    "Window Blinds",
    "TV Stand",
    "Microwave Carts",
    "Computer Desks",
    "Shoe Racks",
    "Nightstands",
    "Closets",
    "Shower Handle Bars",
    "Floating Shelves",
    "Office/Gaming Chairs"
];

function isValidContact(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    return emailRegex.test(input) || phoneRegex.test(input);
}


function findExactItemMatch(message) {
    const normalizedMessage = message.toLowerCase();
    return items.find(item => normalizedMessage.includes(item.toLowerCase()));
}

let requestedItems = []; //to store {item, quantity}
let userStage = 0;
let currentItem = null;
let userContact = null;
let userName = null;
let awaitingQuantity = false;
let confirmingItems = false;


//Display chat messages with optional R2_D2 avatar
function displayMessage(sender, text) {
    const chatLog = document.getElementById("chatlog");
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message");

    if(sender==="ChatBot") {
        messageWrapper.classList.add("r2d2");
        messageWrapper.innerHTML = `
            <img src="Adobe Express - file.png" alt="My Bot" class="avatar" >
            <div class="bubble"><strong>${sender}:</strong> ${text}</div>
    `;

        
    } else {
        messageWrapper.classList.add("user");
        messageWrapper.innerHTML = `<div class="bubble"><strong>${sender}: </strong>${text}</div>`;
    }
    chatLog.appendChild(messageWrapper);
    chatLog.scrollTo({
        top: chatLog.scrollHeight,
        behavior: document.activeElement.matches('#userInput') ? 'auto' : 'smooth'
    })
}

//Handle user input
function sendMessage() {
    const userInput = document.getElementById("userInput");
    const message = userInput.value.trim();
    if (!message) return;

    // Display user message no matter what
    displayMessage("You", message);
    userInput.value = ""; // Clear input field

    // 1. If awaiting quantity, handle quantity input first
    if (awaitingQuantity) {
        const quantity = parseInt(message);
        if (!isNaN(quantity) && quantity > 0) {
            requestedItems.push({ item: currentItem, quantity });
            awaitingQuantity = false;
            displayMessage("ChatBot", "Would you like anything else done for you? (type: yes or no)");
            userStage = 2;
        } else {
            displayMessage("ChatBot", "Please enter a valid quantity (a number greater than 0).");
        }
        return; // Stop processing further
    }

    // 2. Normal flow based on userStage
    if (userStage === 0) {
        userName = message;
        displayMessage("ChatBot", `Nice to meet you, ${userName}! What service do you need? (pick from the listed items above *if they apply to you*)`);
        userStage = 1;

    } else if (userStage === 1) {
        currentItem = items.find(item => message.toLowerCase().includes(item.toLowerCase()));
        if (currentItem) {
            displayMessage("ChatBot", `You selected: ${currentItem}. How many do you need put together?`);
            awaitingQuantity = true; // Now wait for quantity input
        } else {
            displayMessage("ChatBot", "Hmm, it is best to contact me directly. Please contact Elijah directly at elijahshomedecor@gmail.com or (347) 559-1422.");
            return;
        }

    } else if (userStage === 2) {
        if (message.toLowerCase() === "yes") {
            displayMessage("ChatBot", "Okay! Would you like anything else done for you? (type: yes or no)");
            if(message.toLowerCase() === "no") {
                confirmingItems = true; // Set flag to confirm items later
            } else if(message.toLowerCase() === "yes") {
                displayMessage("ChatBot", "Great! What service do you need?");
                userStage = 1; // Go back to item selection
            }
    
        } else if (message.toLowerCase() === "no") {
            // SKIP confirmation and go directly to contact info
            let summary = requestedItems.map(req => `${req.quantity} x ${req.item}`).join(", ");
            displayMessage("ChatBot", `Great! You requested: ${summary}. Please provide your preferred contact method (email or phone number).`);
            userStage = 3;
    
        } else {
            displayMessage("ChatBot", "Please type 'yes' or 'no'.");
        }
    }

    else if (confirmingItems) {
        if (message.toLowerCase() === "yes") {
            displayMessage("ChatBot", "Awesome! Please provide your preferred contact method (email or phone number).");
            userStage = 3;
            confirmingItems = false;
        } else if (message.toLowerCase() === "no") {
            requestedItems = [];
            displayMessage("ChatBot", "Okay, let's start over. What service do you need?");
            userStage = 1;
            confirmingItems = false;
        } else {
            displayMessage("ChatBot", "Please type 'yes' or 'no'.");
        }

    } else if (userStage === 3) {
        userContact = message.trim();
        if (isValidContact(userContact)) {
            displayMessage("ChatBot", `Thank you! Your contact method is: ${userContact}. Please select a date and time for your service.`);
            document.getElementById("calendar").style.display = "block"; // Show calendar
            document.getElementById("datePicker").value = ""; // Reset date picker
            document.getElementById("timePicker").value = ""; // Reset time picker
            document.getElementById("submitDateTime").style.display = "block"; // Show submit button
            // ✅ Set form values properly
            document.getElementById("formService").value = requestedItems.map(req => `${req.quantity} x ${req.item}`).join(", ");
            document.getElementById("formContact").value = userContact;
            document.getElementById("formDate").value = ""; // Reset date field
            document.getElementById("formTime").value = ""; // Reset time field
            
            
            userStage = 4;
        } else {
            displayMessage("ChatBot", "Please provide a valid email or phone number.");
        }
    }
}






//handle both data and time selection and form submission
// Handle both date and time selection and form submission
document.getElementById("submitDateTime").addEventListener("click", () => {
    const date = document.getElementById("datePicker").value;
    const time = document.getElementById("timePicker").value;

    if (userStage === 4 && date && time) {
      displayMessage("You", `Selected: ${date} at ${time}`);
      displayMessage("ChatBot", `Great! You chose ${date} at ${time}. 🛠️`);
  
      // Prepare email details
      const serviceDetails = requestedItems.map(r => `${r.quantity} x ${r.item}`).join(", ");
      const templateParams = {
        user_name: userName,
        user_contact: userContact,
        service_details: requestedItems.map(req => `${req.quantity} x ${req.item}`).join(", "),
        date: date,
        time: time,
        
      };
      
  
      // Send email using EmailJS
      emailjs.send('service_uq26nl3', 'template_g4dgvps', templateParams, 'rw5fT_ypVvZryo790')

        .then(res => {
            console.log('Email sent successfully:', res);
          displayMessage("ChatBot", "✅ Your appointment request has been sent! Elijah will reach out soon to confirm.");
        })
        .catch(err => {
          console.error('EmailJS error:', err);
          displayMessage("ChatBot", "⚠️ Oops! Something went wrong. Please try again later.");
        });
  
      // Hide calendar and finish
      document.getElementById("calendar").style.display = "none";
      userStage = 5;
        
    }
});



document.addEventListener("DOMContentLoaded", () => {
    if(!userName) {
        displayMessage("ChatBot", "Hello! I'm Elijah's ChatBot, your personal assistant. What's your name?");
    }
});

document.getElementById("userInput").addEventListener("keydown", (e) => {
    if(e.key === "Enter") {
        e.preventDefault(); // Prevent form submission
        sendMessage();
    }
});

// Handle feedback form submission and localStorage
document.getElementById("feedbackForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const rating = document.getElementById("feedbackRating").value;
    const comment = document.getElementById("comment").value;

    if(!comment || rating < 1) {
        alert("Please provide a rating and comment before submitting.");
        return;
    }

    const feedback = {
        rating,
        comment,
        author: userName, // Use the current user's name
        timestamp: new Date().toLocaleString(),
        replies: []
    };

    // Get existing feedback from localStorage, or initialize empty array
    let allFeedback = JSON.parse(localStorage.getItem("userFeedback")) || [];
    allFeedback.push(feedback);
    localStorage.setItem("userFeedback", JSON.stringify(allFeedback));

    displayFeedbackMessages();
    this.reset(); // Clear form

    if(!comment || rating<1) {
        alert("Please provide a rating and comment before submitting.");
        return;
    }
});

// Function to load and display feedback
function displayFeedbackMessages() {
    const container = document.getElementById("feedbackMessages");
    const feedbackList = JSON.parse(localStorage.getItem("userFeedback")) || [];

    container.innerHTML = ""; // Clear previous

    feedbackList.forEach((entry, index) => {
        const msg = document.createElement("div");

        let replyHtML = "";
        if(entry.replies && entry.replies.length > 0) {
            replyHtML = `<div style="margin-left: 20px;">Replies:<ul>`;
            entry.replies.forEach(reply => {
                replyHtML += `<li><strong>${reply.author}</strong>${reply.text} <small>🕒 ${reply.timestamp}</small></li>`;
            });
            replyHtML += `</ul></div>`;
        }
                msg.innerHTML = `
            ⭐ Rating: ${entry.rating}<br>
            📝 Comment: ${entry.comment}<br>
            👤 Author: ${entry.author}<br>
            <small>🕒 ${entry.timestamp}</small>
            
            ${
                entry.author === userName || userName.toLowerCase() === "edotty"
                    ? `<button onclick="deleteFeedback(${index})">🗑️ Delete</button>`
                    : ""
            }
            <hr>
        `;
        container.appendChild(msg);
    });
}

//delete feedback function
function deleteFeedback(index) {
    let feedbackList = JSON.parse(localStorage.getItem("userFeedback")) || [];
    if(index >= 0 && index < feedbackList.length) {
        feedbackList.splice(index, 1); //remove selected feedback
        localStorage.setItem("userFeedback", JSON.stringify(feedbackList));
        displayFeedbackMessages(); // Refresh displayed feedback
    }
}

// Call it on page load
document.addEventListener("DOMContentLoaded", () => {
    displayFeedbackMessages(); // Show saved feedback
});

const chatbotSection = document.getElementById("chatbot");
const userInput = document.getElementById("userInput");

userInput.addEventListener("focus", () => {
    window.chatScrollLock = window.scrollY; // Store current scroll position
});

window.addEventListener("scroll", () => {
    if(document.activeElement === userInput && window.chatScrollLock != null) {
        window.scrollTo(0, window.chatScrollLock); // Prevent scrolling when input is focused
    }
});
