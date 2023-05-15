const fs = require('fs/promises')
const path = require('path');
const { nanoid } = require("nanoid");
const { contactSchema } = require('../Utils/validation');


const contactsPath = path.join(__dirname, '../models/contacts.json');

const listContacts = async () => {
  const data = await fs.readFile(contactsPath);
  return JSON.parse(data);
}

const getContactById = async (contactId) => {
  const contacts = await listContacts();
  return contacts.find((contact) => contact.id === contactId);
}

const removeContact = async (contactId) => {
  const contacts = await listContacts();
  const updatedContacts = contacts.filter((contact) => contact.id !== contactId);
  if (updatedContacts.length === contacts.length) {
    return null;
  }
  await fs.writeFile(contactsPath, JSON.stringify(updatedContacts));
  return contactId;
}

const addContact = async (body) => {
   try {
    const { error, value } = contactSchema.validate(body);

    if (error) {
      throw new Error('Validation error');
    }

    const newContact = {
      id: nanoid(),
      ...value,
    };

    const existingContacts = await fs.readFile(contactsPath);
    const contacts = JSON.parse(existingContacts);
    const updatedContacts = [...contacts, newContact];
    await fs.writeFile(contactsPath, JSON.stringify(updatedContacts));

    return newContact;
  } catch (error) {
    throw new Error('Failed to add contact');
  }
}

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.id === contactId);

  if (index === -1) {
    return null;
  }

  const { error, value } = contactSchema.validate(body);
  if (error) {
    throw new Error('Validation error');
  }

  const updatedContact = { ...contacts[index], ...value };
  contacts[index] = updatedContact;
  await fs.writeFile(contactsPath, JSON.stringify(contacts));

  return updatedContact;
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
}
