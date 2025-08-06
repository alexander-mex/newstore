const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Створення транспортера для надсилання листів
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD // Використовуємо App Password
    }
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = Date.now() + 3600000; // 1 година

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailToken,
      emailTokenExpires,
      role: 'user',
    });

    // Перевіряємо налаштування електронної пошти
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration missing. User created but verification email not sent.');
      const token = jwt.sign(
        { 
          userId: user._id,
          role: user.role // Додаємо роль до токена
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(201).json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
        message: 'Користувач створений. Налаштування пошти відсутні - лист не відправлено'
      });
    }

    try {
      // Надсилання листа
      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Підтвердження пошти',
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; background-color: #f5fbef; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border: 1px solid #d4eac7;">
            <h2 style="color: #2e7d32; text-align: center; margin-bottom: 24px;">Підтвердження електронної пошти</h2>
            <p style="color: #4e5d52; font-size: 16px; line-height: 1.6; text-align: center;">
              Дfacialякуємо, що приєдналися! Для завершення реєстрації підтвердьте вашу електронну адресу, натиснувши кнопку нижче:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.CLIENT_URL}/verify-email?token=${emailToken}"
                style="background-color: #81c784; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Підтвердити пошту
              </a>
            </div>
            <p style="color: #607d8b; font-size: 14px; line-height: 1.6; text-align: center;">
              Якщо кнопка не працює, скопіюйте наступне посилання у ваш браузер:
            </p>
            <p style="word-break: break-all; text-align: center; color: #33691e; font-size: 14px;">
              <a href="${process.env.CLIENT_URL}/verify-email?token=${emailToken}"
                style="color: #33691e; text-decoration: underline;">
                ${process.env.CLIENT_URL}/verify-email?token=${emailToken}
              </a>
            </p>
            <p style="color: #a5d6a7; font-size: 12px; text-align: center; margin-top: 32px;">
              ⏳ Це посилання дійсне протягом 1 години.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully to:', email);

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
        message: 'Лист з підтвердженням відправлено на вашу пошту'
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Якщо не вдалося відправити лист, все одно повертаємо успішну відповідь
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({
        user: { id: user._id, name: user.name, email: user.email },
        token,
        message: 'Користувач створений, але лист з підтвердженням не відправлено. Перевірте налаштування пошти.'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Шукаємо користувача та перевіряємо пароль
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }

    // Додаємо перевірку підтвердження пошти
    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false,
        message: 'Пошта не підтверджена. Будь ласка, перевірте вашу електронну пошту для підтвердження.',
        emailNotVerified: true,
        userId: user._id
      });
    }

    // Генерація токена (якщо все в порядку)
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role // Додаємо роль до токена
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      success: true,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
      },
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    console.log('[Server] Token received:', token);
    
    const user = await User.findOne({ emailToken: token });
    if (!user) {
      console.log('[Server] User not found or token expired');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired token',
        redirectUrl: `${process.env.CLIENT_URL}/verify-failed`
      });
    }

    user.emailVerified = true;
    user.emailToken = undefined;
    user.emailTokenExpires = undefined;
    await user.save();

    console.log('[Server] Email verified successfully');
    return res.json({ 
      success: true, 
      message: 'Email verified successfully',
      redirectUrl: `${process.env.CLIENT_URL}/email-verified-success`
    });
  } catch (error) {
    console.error('[Server] Verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during verification',
      redirectUrl: `${process.env.CLIENT_URL}/verify-failed`
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Пошта вже підтверджена' });
    }

    // Перевіряємо налаштування електронної пошти
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({ 
        success: false,
        message: 'Налаштування пошти відсутні' 
      });
    }

    // Генеруємо новий токен
    const emailToken = crypto.randomBytes(32).toString('hex');
    user.emailToken = emailToken;
    user.emailTokenExpires = Date.now() + 3600000; // 1 година
    await user.save();

    try {
      // Відправляємо лист
      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Підтвердження пошти',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Будь ласка, підтвердьте вашу пошту</h2>
            <p>Натисніть кнопку нижче для підтвердження:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/verify-email?token=${emailToken}"
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Підтвердити пошту
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Якщо кнопка не працює, скопіюйте це посилання у ваш браузер:<br>
              <a href="${process.env.CLIENT_URL}/verify-email?token=${emailToken}">
                ${process.env.CLIENT_URL}/verify-email?token=${emailToken}
              </a>
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({ 
        success: true,
        message: 'Лист з підтвердженням відправлено повторно' 
      });

    } catch (emailError) {
      console.error('Email resend failed:', emailError);
      res.status(500).json({ 
        success: false,
        message: 'Помилка при відправці листа: ' + emailError.message 
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -emailToken -emailTokenExpires');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Якщо email змінився
    if (email !== user.email) {
      // Перевірка, чи новий email не зайнятий іншим користувачем
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Генеруємо новий токен для підтвердження
      const emailToken = crypto.randomBytes(32).toString('hex');
      user.emailToken = emailToken;
      user.emailTokenExpires = Date.now() + 3600000; // 1 година
      user.emailVerified = false; // Скидаємо підтвердження
      
      // Відправляємо лист підтвердження
      if (process.env.EMAIL_FROM && process.env.EMAIL_PASSWORD) {
        const transporter = createTransporter();
        
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'Підтвердження нової електронної пошти',
          html: `
            <div style="font-family: 'Segoe UI', sans-serif; background-color: #f5fbef; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border: 1px solid #d4eac7;">
              <h2 style="color: #2e7d32; text-align: center; margin-bottom: 24px;">Підтвердження нової електронної пошти</h2>
              <p style="color: #4e5d52; font-size: 16px; line-height: 1.6; text-align: center;">
                Ви змінили електронну адресу. Для підтвердження нової адреси натисніть кнопку нижче:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.CLIENT_URL}/verify-email?token=${emailToken}"
                  style="background-color: #81c784; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Підтвердити нову пошту
                </a>
              </div>
              <p style="color: #607d8b; font-size: 14px; line-height: 1.6; text-align: center;">
                Якщо кнопка не працює, скопіюйте наступне посилання у ваш браузер:
              </p>
              <p style="word-break: break-all; text-align: center; color: #33691e; font-size: 14px;">
                <a href="${process.env.CLIENT_URL}/verify-email?token=${emailToken}"
                  style="color: #33691e; text-decoration: underline;">
                  ${process.env.CLIENT_URL}/verify-email?token=${emailToken}
                </a>
              </p>
              <p style="color: #a5d6a7; font-size: 12px; text-align: center; margin-top: 32px;">
                ⏳ Це посилання дійсне протягом 1 години.
              </p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
      }
    }

    // Оновлюємо дані користувача
    user.name = name;
    user.email = email;
    user.phone = phone;
    await user.save();

    res.json({ 
      message: 'Profile updated successfully',
      emailChanged: email !== user.email,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid old password' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Генерація токену для скидання пароля
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Генеруємо токен та час дії (1 година)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 година
    await user.save();

    // Відправка листа (аналогічно до верифікації пошти)
    if (process.env.EMAIL_FROM && process.env.EMAIL_PASSWORD) {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Скидання пароля',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Скидання пароля</h2>
            <p>Натисніть кнопку нижче для скидання пароля:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}"
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Скинути пароль
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Якщо кнопка не працює, скопіюйте це посилання у ваш браузер:<br>
              <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}">
                ${process.env.CLIENT_URL}/reset-password?token=${resetToken}
              </a>
            </p>
            <p style="color: #ff0000; font-size: 12px;">
              ⏳ Це посилання дійсне протягом 1 години.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({ 
      success: true,
      message: 'Лист з інструкціями відправлено на вашу пошту' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Скидання пароля
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Невірний або протермінований токен' });
    }

    // Оновлення пароля
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ 
      success: true,
      message: 'Пароль успішно оновлено' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
};