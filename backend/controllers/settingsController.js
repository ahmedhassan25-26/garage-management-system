const getSettings = (req, res) => {
  const settings = {
    companyName: process.env.COMPANY_NAME || "GARAGE NAME",
    companyAddress: process.env.COMPANY_ADDRESS || "123 Main Street, City",
    companyPhone: process.env.COMPANY_PHONE || "0123-456-789",
    companyEmail: process.env.COMPANY_EMAIL || "info@garage.example",
  };

  res.status(200).json({ settings });
};

module.exports = { getSettings };
