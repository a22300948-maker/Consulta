import { Routes } from '@angular/router';
import { CatalogoComponent } from './Componentes/Catalogo/catalogo';
import { CarritoComponent } from './Componentes/Carrito/carrito';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: CatalogoComponent, canActivate: [authGuard] },
  { path: 'catalogo', component: CatalogoComponent, canActivate: [authGuard] },
  { path: 'carrito', component: CarritoComponent, canActivate: [authGuard] },
  {
    path: 'login',
    loadComponent: () => import('./Componentes/Login/login').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./Componentes/Register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./Componentes/Profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'historial',
    loadComponent: () => import('./Componentes/History/history').then(m => m.HistoryComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'registro' }
];
