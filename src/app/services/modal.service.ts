import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Products } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private subject = new Subject<Products | null>();
  modal$ = this.subject.asObservable();

  open(product: Products) {
    this.subject.next(product);
  }

  close() {
    this.subject.next(null);
  }
}
