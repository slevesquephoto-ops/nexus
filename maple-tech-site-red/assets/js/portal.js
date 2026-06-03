// Maple Tech Solutions — Client Portal
// Last updated: 2024-03-15  /  dev: k.bouchard@mapletechsolutions.ca
//
// TODO before production:
//   - Move validation server-side (currently client-side only — NOT SECURE)
//   - Add rate limiting
//   - Add session management

var ACCESS_REF   = "MTS-CL-2048";
var SUCCESS_CODE = "MTS-RECON-2048";

document.addEventListener("DOMContentLoaded", function () {
  var form   = document.getElementById("portal-form");
  var input  = document.getElementById("support-ref");
  var result = document.getElementById("portal-result");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var value = input.value.trim();

    if (value === ACCESS_REF) {
      result.className = "success";
      result.style.display = "block";
      result.innerHTML =
        "✔ Accès accordé. Bienvenue dans votre espace client." +
        "<span class='result-code'>Code de validation : " + SUCCESS_CODE + "</span>" +
        "<small style='display:block;margin-top:0.5rem;opacity:0.7;'>Conservez ce code pour votre dossier de soutien.</small>";
      input.disabled = true;
      form.querySelector("button[type=submit]").disabled = true;
    } else {
      result.className = "error";
      result.style.display = "block";
      result.textContent = "Référence invalide. Veuillez vérifier votre numéro de soutien.";
      input.select();
    }
  });

  // Effacer le message d'erreur quand l'élève retape
  input.addEventListener("input", function () {
    if (result.classList.contains("error")) {
      result.style.display = "none";
    }
  });
});
