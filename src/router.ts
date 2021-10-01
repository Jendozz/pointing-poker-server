import { checkRoom, deleteAvatar, uploadAvatar } from './controllers/RouterController';

const Router = require('express');
const router = new Router();
const multer = require('multer');
const upload = multer();

router.post('/checkRoom', checkRoom);

router.post('/uploadAvatar', upload.single('img'), uploadAvatar);

router.delete('/deleteAvatar', deleteAvatar);

module.exports = router;
