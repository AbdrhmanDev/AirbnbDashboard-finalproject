import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class AsideComponent implements OnInit {
  currentRoute: string = 'home';
userRole: string | null = null;
  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url.split('/')[1] || 'home';
    });
  }
ngOnInit(): void {
    this.userRole = this.getUserRole();
  }
  navigate(route: string) {
    this.currentRoute = route;
    this.router.navigate([route]);
  }
  getUserRole(): string | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData).role : null;
  }
}
