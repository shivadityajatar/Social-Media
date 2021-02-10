const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');


// @route   POST api/users
// @desc    Test route
// @access  Public
router.post(
    '/',
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password','Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            // See if user exists
          let user = await User.findOne({ email });
    
          if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
          }
        
          // Get user gravatar
          const avatar = gravatar.url(email, {
              s: '200',
              r: 'pg',
              d: 'mm'
            });
            
          
          user = new User({
            name,
            email,
            avatar,
            password
          });
 
          // Encrypt password
          const salt = await bcrypt.genSalt(10);
         
          user.password = await bcrypt.hash(password, salt);

          // Save in mongoDB
          await user.save();

        // Return jsonwebtoken to enable user to login after just signup
        const payload = {
            user: {
              id: user.id // this id(objectId) we get from mongoDB
            }
          };
    
          jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: '5 days' },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    }
);
    

module.exports = router;

