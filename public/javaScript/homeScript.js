// menu bar button
document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector("button.menu-button");
  const navLinks = document.querySelector("ul.nav-links");

  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
  
  // Close menu when clicking outside of it
  document.addEventListener("click", (event) => {
    const targetElement = event.target;
    // Check if the clicked element is not part of the menu or button
    if (!menuButton.contains(targetElement)) {
      navLinks.classList.remove("open");
    }
  });
});

// Navbar
const navbar = document.querySelector(".navbar");
const navbarToggle = document.querySelector(".navbar-toggle");

navbarToggle.addEventListener("click", function () {
  navbar.classList.toggle("navbar--open");
});

function validateForm() {
  var name = document.getElementById('name').value;
  var country = document.getElementById('country').value;
  var city = document.getElementById('city').value;

  var letters = /^[A-Za-z]+$/;

  if (!name.match(letters)) {
    alert('Please enter only letters for Full Name');
    return false;
  }

  if (!country.match(letters)) {
    alert('Please enter only letters for Country');
    return false;
  }

  if (!city.match(letters)) {
    alert('Please enter only letters for City');
    return false;
  }

  return true;
}