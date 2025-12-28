// Select DOM elements
const bodyElement = document.querySelector("body");
const navbarMenu = document.querySelector("header");
const hamburgerMenus = document.querySelectorAll(".mobile-menu-toggle");

// Function to toggle the aria-expanded attribute
function toggleAriaExpanded(element, forceValue = null) {
    const isExpanded =
        forceValue !== null
            ? forceValue
            : element.getAttribute("aria-expanded") === "true";

    element.setAttribute("aria-expanded", (!isExpanded).toString());
}

// Function to toggle the menu open or closed
function toggleMenu() {
    const isOpening = !navbarMenu.classList.contains("active");

    navbarMenu.classList.toggle("active", isOpening);
    bodyElement.classList.toggle("mobile-menu", isOpening);

    hamburgerMenus.forEach(button => {
        button.classList.toggle("active", isOpening);
        toggleAriaExpanded(button, !isOpening);
    });
}

// Add click event listeners to all hamburger menu buttons
hamburgerMenus.forEach(button => {
    button.addEventListener("click", toggleMenu);
});

// Add click event listener to the navbar menu (overlay click)
navbarMenu.addEventListener("click", function (event) {
    if (event.target === navbarMenu && navbarMenu.classList.contains("active")) {
        toggleMenu();
    }
});

// Function to handle dropdown toggle
function toggleDropdown(element, event) {
    event?.stopPropagation();

    element.classList.toggle("active");

    const dropdownButton = element.querySelector(".dropdown-button");
    const dropdownContent = element.querySelector(".dropdown-content");

    if (dropdownButton) {
        toggleAriaExpanded(dropdownButton);
    }

    if (dropdownContent) {
        dropdownContent.setAttribute(
            "aria-hidden",
            (!element.classList.contains("active")).toString()
        );
    }
}

// Function to close dropdown
function closeDropdown(element) {
    element.classList.remove("active");

    const dropdownButton = element.querySelector(".dropdown-button");
    const dropdownContent = element.querySelector(".dropdown-content");

    dropdownButton?.setAttribute("aria-expanded", "false");
    dropdownContent?.setAttribute("aria-hidden", "true");
}

// Initialize dropdowns
document.querySelectorAll(".dropdown").forEach(dropdown => {
    const dropdownButton = dropdown.querySelector(".dropdown-button");
    const dropdownContent = dropdown.querySelector(".dropdown-content");

    dropdownButton?.setAttribute("aria-expanded", "false");
    dropdownButton?.setAttribute("aria-haspopup", "true");
    dropdownContent?.setAttribute("aria-hidden", "true");

    dropdownButton?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(dropdown, event);
    });

    dropdown.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeDropdown(dropdown);
            dropdownButton?.focus();
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleDropdown(dropdown, event);
        }
    });

    document.addEventListener("click", event => {
        if (!dropdown.contains(event.target)) {
            closeDropdown(dropdown);
        }
    });
});

// Handle dropdown links
document.querySelectorAll(".drop-li > .li-link").forEach(link => {
    link.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            window.location.href = link.href;
        }
    });
});

// Close mobile menu on Escape key
document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        navbarMenu.classList.contains("active")
    ) {
        toggleMenu();
    }
});

// Add scroll class to body element
document.addEventListener("scroll", () => {
    bodyElement.classList.toggle(
        "scroll",
        document.documentElement.scrollTop >= 100
    );
});
