import { nav, bootGlobalUI } from './utils.js';

function activePage(){
  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const map={
    'index.html':'home',
    'businesses.html':'businesses',
    'business.html':'businesses',
    'products.html':'products',
    'deals.html':'deals',
    'pricing.html':'pricing',
    'dashboard.html':'dashboard',
    'business-dashboard.html':'business-dashboard',
    'admin.html':'admin',
    'admin-users.html':'admin-users',
    'demands.html':'demands'
  };
  return map[file]||'';
}

const navHost=document.querySelector('#nav');
if(navHost && !navHost.querySelector('.header')) navHost.innerHTML=nav(activePage());
bootGlobalUI();
