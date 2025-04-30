import { query } from '../config/db.js';


// reminder to add credits to the user when they sign up
// also add a scene limit to the user when they sign up
// this file is for future reference and use
const createUser = async (username, hashedPassword) => {
  await query("INSERT INTO users (username, password, credits) VALUES (?, ?, ?)", [username, hashedPassword, 0]);
};

const getUserByUsername = async (username) => {
  const [users] = await query("SELECT * FROM users WHERE username = ?", [username]);
  return users.length ? users[0] : null;
};

const updateUserCredits = async (userId, credits) => {
  await query("UPDATE users SET credits = credits + ? WHERE id = ?", [credits, userId]);
};

const getUserCredits = async (userId) => {
  const [result] = await query("SELECT credits FROM users WHERE id = ?", [userId]);
  return result.length ? result[0].credits : 0;
};

const updateUserOrder = async (userId, orderId, amount, status) => {
  await query(
    "UPDATE users SET order_id = ?, amount = ?, status = ? WHERE id = ?",
    [orderId, amount, status, userId]
  );
};

const getUserByOrderId = async (orderId) => {
  console.log(`Looking for user with order_id="${orderId}"`);
  
  try {
    // Use a direct query for maximum reliability
    const [users] = await query("SELECT * FROM users WHERE order_id = ?", [orderId]);
    
    if (users && users.length > 0) {
      console.log(`Found user with id=${users[0].id} for order_id="${orderId}"`);
      return users[0];
    } else {
      console.log(`No user found with order_id="${orderId}"`);
      return null;
    }
  } catch (error) {
    console.error('Error in getUserByOrderId:', error);
    return null;
  }
};

const completePayment = async (userId, paymentId, status, credits, sceneLimit) => {
  console.log('Attempting to complete payment with params:', {
    userId,
    paymentId,
    status,
    credits,
    sceneLimit
  });
  
  try {
    await query(
      "UPDATE users SET payment_id = ?, status = ?, credits = credits + ?, scene_limit = ? WHERE id = ?",
      [paymentId, status, credits, sceneLimit, userId]
    );
    
    // Verify the update was successful
    const [updatedUser] = await query("SELECT * FROM users WHERE id = ?", [userId]);
    console.log('Payment completion result:', updatedUser);
    
    if (!updatedUser || updatedUser.status !== status) {
      throw new Error('Payment status update failed to apply');
    }
  } catch (error) {
    console.error('Error in completePayment:', error);
    throw error;
  }
};

const getUserSceneLimit = async (userId) => {
  const [result] = await query("SELECT scene_limit FROM users WHERE id = ?", [userId]);
  return result.length ? result[0].scene_limit : 10;
};

export default { createUser, getUserByUsername, updateUserCredits, getUserCredits, updateUserOrder, getUserByOrderId, completePayment, getUserSceneLimit };
