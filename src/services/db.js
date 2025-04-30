import mysql from 'mysql2/promise';

const saveUser = async (pool, id, email, username) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (id, email, username) VALUES (?, ?, ?)',
      [id, email, username]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

export { saveUser };
