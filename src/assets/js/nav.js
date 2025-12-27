// Select DOM elements
const bodyElement = document.querySelector("body");
const navbarMenu = document.querySelector("header");
const hamburgerMenu = document.querySelector("header #mobile-menu-toggle");

// Function to toggle the aria-expanded attribute
function toggleAriaExpanded(element) {
    const isExpanded = element.getAttribute("aria-expanded") === "true";
    element.setAttribute("aria-expanded", (!isExpanded).toString());
}

// Function to toggle the menu open or closed
function toggleMenu() {
    hamburgerMenu.classList.toggle("active");
    navbarMenu.classList.toggle("active");
    bodyElement.classList.toggle("mobile-menu");
    toggleAriaExpanded(hamburgerMenu);
}

// Add click event listener to the hamburger menu
hamburgerMenu.addEventListener("click", toggleMenu);

// Add click event listener to the navbar menu to handle clicks on the pseudo-element
navbarMenu.addEventListener("click", function (event) {
    if (event.target === navbarMenu && navbarMenu.classList.contains("active")) {
        toggleMenu();
    }
});

// Function to handle dropdown toggle
function toggleDropdown(element, event) {
    // Prevent the event from bubbling up to parent dropdowns
    event?.stopPropagation();

    // Toggle the active class
    element.classList.toggle("active");

    // Find and toggle the dropdown button's aria-expanded state
    const dropdownButton = element.querySelector(".dropdown-button");
    if (dropdownButton) {
        toggleAriaExpanded(dropdownButton);
    }

    // Find and toggle the dropdown content's visibility
    const dropdownContent = element.querySelector(".dropdown-content");
    if (dropdownContent) {
        const isVisible = element.classList.contains("active");
        dropdownContent.setAttribute("aria-hidden", (!isVisible).toString());
    }
}

// Function to close dropdown
function closeDropdown(element) {
    element.classList.remove("active");
    const dropdownButton = element.querySelector(".dropdown-button");
    const dropdownContent = element.querySelector(".dropdown-content");

    if (dropdownButton) {
        dropdownButton.setAttribute("aria-expanded", "false");
    }

    if (dropdownContent) {
        dropdownContent.setAttribute("aria-hidden", "true");
    }
}

// Initialize dropdowns
const dropdownElements = document.querySelectorAll(".dropdown");
dropdownElements.forEach(dropdown => {
    const dropdownButton = dropdown.querySelector(".dropdown-button");
    const dropdownContent = dropdown.querySelector(".dropdown-content");

    // Set initial ARIA attributes
    if (dropdownButton) {
        dropdownButton.setAttribute("aria-expanded", "false");
        dropdownButton.setAttribute("aria-haspopup", "true");
    }

    if (dropdownContent) {
        dropdownContent.setAttribute("aria-hidden", "true");
    }

    // Handle click events on dropdown buttons
    dropdownButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(dropdown, event);
    });

    // Handle keyboard navigation
    dropdown.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeDropdown(dropdown);
            dropdownButton?.focus();
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleDropdown(dropdown, event);
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) {
            closeDropdown(dropdown);
        }
    });
});

// Handle dropdown links
const dropdownLinks = document.querySelectorAll(".drop-li > .li-link");
dropdownLinks.forEach(link => {
    link.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            window.location.href = this.href;
        }
    });
});

// Close mobile menu on Escape key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && hamburgerMenu.classList.contains("active")) {
        toggleMenu();
    }
});

// Add scroll class to body element
document.addEventListener('scroll', () => {
    const scroll = document.documentElement.scrollTop;
    bodyElement.classList.toggle('scroll', scroll >= 100);
});