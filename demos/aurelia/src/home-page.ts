import { IAurelia, resolve } from 'aurelia';

export class HomePage {
  constructor(private aurelia: IAurelia = resolve(IAurelia)) {
    console.log(aurelia);
  }
}
