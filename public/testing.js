// Function to close all dropdowns except the one passed as an argument
function closeAllDropdowns(except) {
  document.querySelectorAll(".custom-select").forEach((select) => {
    if (select !== except) {
      select.classList.remove("open");
      select.querySelector(".arrow").classList.remove("open");
    }
  });
}

// Function to handle click event on each custom select wrapper
function setupCustomSelect(wrapper) {
  let select = wrapper.querySelector(".custom-select");
  let arrow = wrapper.querySelector(".arrow");

  wrapper.addEventListener("click", function (event) {
    // Close all other dropdowns
    closeAllDropdowns(select);

    // Toggle the "open" class on the custom-select and arrow within this wrapper
    select.classList.toggle("open");
    arrow.classList.toggle("open");

    // Stop propagation to prevent window listener from immediately closing the dropdown
    event.stopPropagation();
  });
  let options = wrapper.querySelectorAll(".custom-option");
  options.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove "selected" class from previously selected option
      let currentlySelected = select.querySelector(".custom-option.selected");
      if (currentlySelected) {
        currentlySelected.classList.remove("selected");
      }
      // Add "selected" class to clicked option and update display text
      option.classList.add("selected");
      select.querySelector(".custom-select__trigger span").textContent =
        option.textContent;

      // Check if 'Any' is selected
      if (
        option.getAttribute("value") === "any" &&
        wrapper.querySelector('[name="styleID"]')
      ) {
        // Select a random stylist excluding 'Any'
        const styleOptions = Array.from(
          wrapper.querySelectorAll('.custom-option[value][value!="any"]')
        );
        const randomIndex = Math.floor(Math.random() * styleOptions.length);
        document.getElementById("styleID").value =
          styleOptions[randomIndex].getAttribute("value");
      } else {
        // Update hidden input values
        if (wrapper.querySelector('[name="styleID"]')) {
          document.getElementById("styleID").value =
            option.getAttribute("value");
        } else if (wrapper.querySelector('[name="servicesID"]')) {
          document.getElementById("servicesID").value =
            option.getAttribute("data-value");
        }
      }
    });
  });
}

// Setup each custom select with its own event listeners
document.querySelectorAll(".custom-select-wrapper").forEach(setupCustomSelect);

// Event listener to close all dropdowns when clicking anywhere in the window
window.addEventListener("click", function () {
  closeAllDropdowns();
});
