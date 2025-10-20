const express = require("express");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

const app = express();

// Load all invoices once
const invoiceData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "invoiceData.json"), "utf8")
);

app.get("/invoice/:invoiceNumber", async (req, res) => {
  try {
    const invoiceNumber = req.params.invoiceNumber;
    const invoice = invoiceData.invoices.find(
      (inv) => inv.invoiceNumber === invoiceNumber
    );

    if (!invoice) {
      return res.status(404).send(`Invoice ${invoiceNumber} not found`);
    }

    const templateHtml = fs.readFileSync(
      path.join(__dirname, "templates", "invoice.hbs"),
      "utf8"
    );
    const template = handlebars.compile(templateHtml);
    const html = template(invoice);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px" },
    });

    await browser.close();

    res.contentType("application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating invoice PDF");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Invoice server running at http://localhost:${PORT}`);
});
