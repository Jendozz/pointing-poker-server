import { ROOM_LIST } from './../storage';
import { MulterRequest } from '../types';
import fs from 'fs';
import path from 'path';
import { Response, Request } from 'express';
import { findAvatarById, getExtFromFileName } from '../helpers';

export function checkRoom(req: Request, res: Response): void {
  const data = JSON.parse(JSON.stringify(req.body));
  if (Object.prototype.hasOwnProperty.call(ROOM_LIST, data.roomKey)) {
    res.status(200).send();
  } else res.status(404).send({ message: 'Room is not exist' });
}

export async function uploadAvatar(req: MulterRequest, res: Response): Promise<void> {
  const {
    file: { originalname, buffer },
    body: { userId },
  } = req;
  const ext = getExtFromFileName(originalname);
  fs.writeFile(path.resolve(__dirname, `../../public/avatars/${userId}.${ext}`), buffer, 'ascii', err => {
    if (err) {
      res.status(500).json({ Error: err });
    } else {
      res.status(200).json({ result: `avatars/${userId}.${ext}` });
    }
  });
}

export async function deleteAvatar(req: Request): Promise<void> {
  const { userId } = JSON.parse(JSON.stringify(req.body));
  fs.readdir(path.resolve(__dirname, `../../public/avatars`), (err, files) => {
    if (err) console.log(err);
    else {
      const fileName = findAvatarById(files, userId);
      if (fileName) {
        fs.unlink(path.resolve(__dirname, `../../public/avatars/${fileName}`), error => {
          if (err) {
            console.log(error);
          } else {
            console.log('avatar deleted');
          }
        });
      }
    }
  });
}
