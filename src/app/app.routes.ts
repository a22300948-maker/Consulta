import { Routes } from '@angular/router';
import { CatalogoComponent } from './Componentes/Catalogo/catalogo';
import { CarritoComponent } from './Componentes/Carrito/carrito';

export const routes: Routes = [
    { path: '', component: CatalogoComponent  },
    { path: 'catalogo', component: CatalogoComponent  },
    { path: 'carrito', component: CarritoComponent },
    { path: 'registro',
        loadComponent: () =>
            import('./auth/register.component.ts/register.component.ts').then(m => m.RegisterComponentTs)
     },
     { path: 'perfil',
        loadComponent: () =>
            import('./user/profile.component.ts/profile.component.ts').then(m => m.ProfileComponentTs)
     },
     {path: 'historial',
        loadComponent: () =>
            import('./user/history.component.ts/history.component.ts').then(m => m.HistoryComponentTs)
     }
];