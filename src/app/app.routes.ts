import { Routes } from '@angular/router';
import { CatalogoComponent } from './Componentes/Catalogo/catalogo';
import { Carrito } from './Componentes/Carrito/carrito';

export const routes: Routes = [
    { path: '', component: CatalogoComponent  },
    { path: 'catalogo', component: CatalogoComponent  },
    { path: 'carrito', component: Carrito }
];
