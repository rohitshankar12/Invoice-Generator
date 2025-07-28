document.addEventListener("DOMContentLoaded", () => {
  const { jsPDF } = window.jspdf;

  // --- DOM ELEMENTS ---
  const addItemBtn = document.getElementById("addItemBtn");
  const itemsContainer = document.getElementById("items-container");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const invoicePreview = document.getElementById("invoice-preview");
  const logoUpload = document.getElementById("logoUpload");
  const previewLogo = document.getElementById("preview-logo");
  const currencySelect = document.getElementById("currency");

  // Input fields for live updates
  const allInputs = document.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="date"], textarea, select'
  );

  let itemCounter = 0;

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00"); // Avoid timezone issues
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  }

  function createItemRow() {
    itemCounter++;
    const itemRow = document.createElement("div");
    itemRow.classList.add(
      "grid",
      "grid-cols-12",
      "gap-2",
      "items-center",
      "item-row"
    );
    itemRow.innerHTML = `
          <input type="text" placeholder="Description" class="col-span-6 p-2 border rounded-md bg-gray-50 item-desc">
          <input type="number" placeholder="1" value="1" class="col-span-2 p-2 border rounded-md bg-gray-50 item-qty">
          <input type="number" placeholder="0.00" value="0.00" step="0.01" class="col-span-2 p-2 border rounded-md bg-gray-50 item-rate">
          <p class="col-span-1 text-right p-2 item-amount">0.00</p>
          <button class="col-span-1 remove-item-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
      `;
    itemsContainer.appendChild(itemRow);

    // Add event listeners to new inputs
    itemRow.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", updatePreview);
    });

    itemRow.querySelector(".remove-item-btn").addEventListener("click", (e) => {
      e.preventDefault();
      itemRow.remove();
      updatePreview();
    });
  }

  function updatePreview() {
    const currencySymbol = currencySelect.value;
    document.getElementById("preview-companyName").innerText =
      document.getElementById("companyName").value || "Your Company Name";
    document.getElementById("preview-companyDetails").innerText =
      document.getElementById("companyDetails").value || "Your Details...";
    document.getElementById("preview-clientName").innerText =
      document.getElementById("clientName").value || "Client's Company";
    document.getElementById("preview-clientDetails").innerText =
      document.getElementById("clientDetails").value || "Client's Details...";
    document.getElementById("preview-invoiceNumber").innerText =
      document.getElementById("invoiceNumber").value || "INV-001";

    const invoiceDateValue = document.getElementById("invoiceDate").value;
    const dueDateValue = document.getElementById("dueDate").value;
    const today = new Date().toISOString().split("T")[0];

    document.getElementById("preview-invoiceDate").innerText = formatDate(
      invoiceDateValue || today
    );
    document.getElementById("preview-dueDate").innerText =
      formatDate(dueDateValue);

    const previewItemsTable = document.getElementById("preview-items-table");
    previewItemsTable.innerHTML = "";
    let subtotal = 0;
    const itemRows = document.querySelectorAll(".item-row");

    itemRows.forEach((row) => {
      const desc = row.querySelector(".item-desc").value;
      const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
      const rate = parseFloat(row.querySelector(".item-rate").value) || 0;
      const amount = qty * rate;
      row.querySelector(".item-amount").innerText = `${currencySymbol}${amount.toFixed(2)}`;
      subtotal += amount;

      if (desc) {
        const previewRow = `
                  <tr>
                      <td class="p-3">${desc}</td>
                      <td class="text-center p-3">${qty}</td>
                      <td class="text-center p-3">${currencySymbol}${rate.toFixed(2)}</td>
                      <td class="text-right p-3">${currencySymbol}${amount.toFixed(2)}</td>
                  </tr>
              `;
        previewItemsTable.innerHTML += previewRow;
      }
    });

    const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    document.getElementById("preview-subtotal").innerText = `${currencySymbol}${subtotal.toFixed(2)}`;
    document.getElementById("preview-taxRate").innerText = taxRate;
    document.getElementById("preview-tax").innerText = `${currencySymbol}${tax.toFixed(2)}`;
    document.getElementById("preview-total").innerText = `${currencySymbol}${total.toFixed(2)}`;
  }

  async function generatePDF() {
    const originalWidth = invoicePreview.style.width;
    downloadPdfBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...`;
    downloadPdfBtn.disabled = true;

    try {
      await document.fonts.ready;
      invoicePreview.style.width = "800px";
      await new Promise((r) => setTimeout(r, 150)); // Wait for layout reflow

      const canvas = await html2canvas(invoicePreview, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#fff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const invoiceNumber =
        document.getElementById("invoiceNumber").value || "invoice";
      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        "Sorry, there was an error generating the PDF. Please check the console for details."
      );
    } finally {
      invoicePreview.style.width = originalWidth;
      downloadPdfBtn.innerHTML = "Download PDF";
      downloadPdfBtn.disabled = false;
    }
  }

  // --- EVENT LISTENERS ---
  addItemBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createItemRow();
    updatePreview();
  });

  downloadPdfBtn.addEventListener("click", generatePDF);

  logoUpload.addEventListener("change", () => {
    const file = logoUpload.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewLogo.src = e.target.result;
        previewLogo.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  // Add event listener to all initial inputs
  allInputs.forEach((input) => {
    input.addEventListener("input", updatePreview);
  });

  // --- INITIALIZATION ---
  document.getElementById("invoiceDate").valueAsDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  document.getElementById("dueDate").valueAsDate = dueDate;

  createItemRow();
  updatePreview();
});