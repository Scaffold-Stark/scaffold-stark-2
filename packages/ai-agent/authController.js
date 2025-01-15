import { createUser, findUserByEmail, updateUserByEmail } from '../models/userModel.js';
import { generateToken } from '../utils/jwt.js';

const signup = async (req, res) => {
  const { email, name, lastName, companyName, companyTitle, gender } = req.body;
  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).send('User already exists.');
    }
    if(!email || !name || !lastName || !companyName || !companyTitle || !gender) return res.status(200).send('Missing fields.');
    const user = await createUser({ email, name, lastName, companyName, companyTitle, tutorial: false, gender:gender });
    const token = generateToken(user);
    res.status(201).send({ token, user });
  } catch (error) {
    res.status(500).send('Error creating user.');
  }
};

const login = async (req, res) => {
  const { email } = req.body;
  try {
    if(!email) return res.status(200).send('No email provided.');
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(200).send('User not found.');
    }
    const token = generateToken(user);
    res.status(200).send({ token, user });
  } catch (error) {
    res.status(200).send('Error logging in.');
  }
};

const logout = (req, res) => {
  res.status(200).send('Logged out.');
};

const editImage = async (req, res) => {
  const { email, image } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).send('User not found.');
    }
    await updateUserByEmail(email, { image });
    res.status(200).send({
      ...user,
      image:image,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error updating user.');
  }
};

const deleteUser = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).send('User not found.');
    }
    await user.remove();
    res.status(200).send('User deleted successfully.');
  } catch (error) {
    res.status(500).send('Error deleting user.');
  }
};

const test = (req, res) => {
  res.status(200).send('Test passed.');
};

export { signup, login, editImage, deleteUser, logout, test };
