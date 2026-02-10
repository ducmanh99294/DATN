const Contact = require("../models/Contact");

exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const contact = await Contact.create({
      user: req.user?.id || null,
      name,
      email,
      phone,
      subject,
      message
    });

    res.status(201).json({
      message: "Contact sent successfully",
      data: contact
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getContacts = async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const contacts = await Contact.find(filter)
    .populate("user", "email role")
    .sort({ createdAt: -1 });

  res.json(contacts);
};

exports.getContactById = async (req, res) => {
  const contact = await Contact.findById(req.params.id)
    .populate("user", "email role");

  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  res.json(contact);
};

exports.updateContact = async (req, res) => {
  const { status, adminNote } = req.body;

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status, adminNote },
    { new: true }
  );

  res.json({
    message: "Contact updated",
    data: contact
  });
};

exports.deleteContact = async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ message: "Contact deleted" });
};
