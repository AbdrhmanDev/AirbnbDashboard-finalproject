import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class AsideComponent implements OnInit, OnDestroy {
  currentRoute: string = 'home';
userRole: string | null = null;
private userSubscription: Subscription | undefined;
  constructor(private router: Router, private userStateService: UserStateService) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url.split('/')[1] || 'home';
    });
  }
ngOnInit(): void {
    this.userRole = this.getUserRole();
    this.userSubscription = this.userStateService.user$.subscribe(user => {
      this.userRole = user?.role || null;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  navigate(route: string) {
    this.currentRoute = route;
    this.router.navigate([route]);
  }
  getUserRole(): string | null {
    const user = this.userStateService.getUser();
    return user?.role || null;
  }
}
