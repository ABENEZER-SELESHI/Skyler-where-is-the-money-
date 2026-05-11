import mongoose from 'mongoose';

/**
 * Stores authenticated Telegram user sessions.
 * The sessionString is the serialized GramJS session used to reconnect without re-auth.
 */
const userSessionSchema = new mongoose.Schema({
  telegramUsername: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  sessionString: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserSession = mongoose.model('UserSession', userSessionSchema);

export default UserSession;
