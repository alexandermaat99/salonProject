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
    });
  });
}

// Setup each custom select with its own event listeners
document.querySelectorAll(".custom-select-wrapper").forEach(setupCustomSelect);

// Event listener to close all dropdowns when clicking anywhere in the window
window.addEventListener("click", function () {
  closeAllDropdowns();
});
