import { Routes } from '@angular/router';
import { CatalogoComponent } from './components/catalogo.component';
import { Carrito } from './components/carrito/carrito';

export const routes: Routes = [
    { path: '', component: CatalogoComponent  },
    { path: 'catalogo', component: CatalogoComponent  },
    { path: 'carrito', component: Carrito }
];
