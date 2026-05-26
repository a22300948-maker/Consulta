import { Routes } from '@angular/router';
import { CatalogoComponent } from './Componentes/Catalogo/catalogo';
import { CarritoComponent } from './Componentes/Carrito/carrito';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { nonAdminGuard } from './core/guards/non-admin.guard';

export const routes: Routes = [
  { path: '', component: CatalogoComponent, canActivate: [authGuard, nonAdminGuard] },
  { path: 'catalogo', component: CatalogoComponent, canActivate: [authGuard, nonAdminGuard] },
  { path: 'carrito', component: CarritoComponent, canActivate: [authGuard, nonAdminGuard] },
  {
    path: 'admin',
    loadComponent: () => import('./Componentes/Admin/admin').then(m => m.AdminComponent),
    canActivate: [authGuard, adminGuard]
  },
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
    canActivate: [authGuard, nonAdminGuard]
  },
  {
    path: 'historial',
    loadComponent: () => import('./Componentes/History/history').then(m => m.HistoryComponent),
    canActivate: [authGuard, nonAdminGuard]
  },
  { path: '**', redirectTo: 'registro' }
];
