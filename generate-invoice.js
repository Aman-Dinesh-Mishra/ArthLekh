const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

// Load invoice data with multiple invoices
const invoiceData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "invoiceData.json"), "utf8")
);

async function createInvoicePDF(invoice) {
  const templateHtml = fs.readFileSync(
    path.join(__dirname, "templates", "invoice.hbs"),
    "utf8"
  );
  const template = handlebars.compile(templateHtml);
  const html = template(invoice);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Name each PDF uniquely using invoice number
  const pdfPath = path.join(__dirname, `invoice-${invoice.invoiceNumber}.pdf`);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px" },
  });

  await browser.close();
  console.log(`PDF created at: ${pdfPath}`);
}

// Iterate over each invoice and generate PDF
async function generateAllInvoices() {
  for (const invoice of invoiceData.invoices) {
    await createInvoicePDF(invoice);
  }
}

generateAllInvoices().catch(console.error);
