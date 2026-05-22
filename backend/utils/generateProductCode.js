import Product from "../models/Product.js";

async function generateProductCode() {
  let exists = true;
  let code;

  while (exists) {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    code = `PROD-${year}-${random}`;

    exists = await Product.findOne({
      productCode: code,
    });
  }

  return code;
}

export default generateProductCode;
