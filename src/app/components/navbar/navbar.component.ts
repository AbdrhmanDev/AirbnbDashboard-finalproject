import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';
import { LoginService } from '../../services/login.service';
import { UserService } from '../../services/user.service';
import { UserStateService } from '../../services/user-state.service';
import { BookingService } from '../../services/booking.service';
import { UserResponse } from '../../models/user';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RevenueService } from '../../services/revenue.service';
interface RevenueResponse {
  totalRevenue: number;
}
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('notificationsContainer') notificationsContainer!: ElementRef;

  public recentActivities: any[] = [];
  public notifications: Notification[] = [];
  public totalRevenue = 0;
  public user: UserResponse | null = null;
  public showNotifications = false;
  public unreadCount = 0;
  private userSubscription: Subscription | null = null;

  // UI state properties
  public isUserMenuOpen = false;
  public searchQuery = '';
  public getRevenue = 0;
  constructor(
    private notificationService: NotificationService,
    private loginService: LoginService,
    private userService: UserService,
    private userStateService: UserStateService,
    private bookingService: BookingService,
    private router: Router,
    private elementRef: ElementRef,
    private revenueService: RevenueService
  ) {}
  ngOnInit() {
    // Load initial user state
    this.user = this.userStateService.getUser();
    console.log('user >>>>>>>>>>>>>>>>>>>>', this.user);
    if (this.user?._id) {
      this.loadTotalRevenue(this.user._id);
      this.loadRecentActivities();
      this.loadNotifications();
    }

    // Subscribe to user state changes
    this.userSubscription = this.userStateService.user$.subscribe((user) => {
      this.user = user;
      if (user?._id) {
        this.loadTotalRevenue(user._id);
        this.loadRecentActivities();
        this.loadNotifications();
      }
    });

    // Subscribe to notifications changes
    this.notificationService.notifications$.subscribe((notifications) => {
      console.log('Received notifications update:', notifications);
      this.notifications = notifications;
      this.unreadCount = notifications.filter((n) => !n.read).length;
    });

    // Try to load fresh user data if we have a token
    this.loadUser();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadNotifications() {
    console.log('Loading notifications for user:', this.user);
    if (this.user?.role === 'Host' && this.user._id) {
      console.log('Loading host notifications for ID:', this.user._id);
      this.notificationService.getHostNotifications(this.user._id).subscribe({
        next: (notifications: Notification[]) => {
          console.log('Host notifications loaded:', notifications);
          this.notifications = notifications;
          this.unreadCount = notifications.filter(
            (n: Notification) => !n.read
          ).length;
        },
        error: (error: Error) => {
          console.error('Error loading host notifications:', error);
          this.notifications = [];
          this.unreadCount = 0;
        },
      });
    } else if (this.user?.role === 'Admin') {
      console.log('Loading admin notifications');
      this.notificationService.getNotifications().subscribe({
        next: (notifications: Notification[]) => {
          console.log('Admin notifications loaded:', notifications);
          this.notifications = notifications;
          this.unreadCount = notifications.filter(
            (n: Notification) => !n.read
          ).length;
        },
        error: (error: Error) => {
          console.error('Error loading notifications:', error);
          this.notifications = [];
          this.unreadCount = 0;
        },
      });
    } else {
      console.log('No notifications to load for current user role');
      this.notifications = [];
      this.unreadCount = 0;
    }
  }

  loadTotalRevenue(userId: string) {
    if (this.user?.role === 'Host') {
      this.bookingService.getHostBookings(userId).subscribe({
        next: (bookings) => {
          this.totalRevenue = bookings.reduce((total, booking) => {
            const confirmedPropertiesTotal = booking.properties
              .filter((prop) => prop.status === 'confirmed')
              .reduce(
                (propTotal, prop) => propTotal + (prop.totalPrice || 0),
                0
              );
            return total + confirmedPropertiesTotal;
          }, 0);
        },
        error: (error) => {
          console.error('Error loading total revenue:', error);
        },
      });
    } else if (this.user?.role === 'Admin') {
      this.bookingService.getBookings().subscribe({
        next: (bookings) => {
          this.totalRevenue = bookings.reduce((total, booking) => {
            const confirmedPropertiesTotal = booking.properties
              .filter((prop) => prop.status === 'confirmed')
              .reduce(
                (propTotal, prop) => propTotal + (prop.totalPrice || 0),
                0
              );
            return total + confirmedPropertiesTotal;
          }, 0);
        },
        error: (error) => {
          console.error('Error loading total revenue:', error);
        },
      });
    }
  }

  loadRecentActivities() {
    if (this.user?.role === 'Host' && this.user._id) {
      this.bookingService.getHostBookings(this.user._id).subscribe({
        next: (bookings) => {
          console.log('Host bookings:', bookings); // Debug log
          // Convert bookings to activities
          const activities = bookings.map((booking) => ({
            type: booking.properties[0]?.status || 'pending',
            message: `New booking for ${
              typeof booking.properties[0]?.propertyId === 'object'
                ? booking.properties[0]?.propertyId?.title
                : 'Property'
            }`,
            time: booking.createdAt || new Date(),
            amount: booking.properties[0]?.totalPrice || 0,
          }));

          // Sort by time and take the most recent 5
          this.recentActivities = activities
            .sort(
              (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
            )
            .slice(0, 5);

          // Update unread count to include new activities
          this.unreadCount =
            this.notifications.filter((n) => !n.read).length +
            this.recentActivities.filter((a) => a.type === 'pending').length;
        },
        error: (error) => {
          console.error('Error loading host activities:', error);
          this.recentActivities = [];
        },
      });
    } else if (this.user?.role === 'Admin') {
      this.bookingService.getBookings().subscribe({
        next: (bookings) => {
          console.log('Admin bookings:', bookings); // Debug log
          const activities = bookings.map((booking) => ({
            type: booking.properties[0]?.status || 'pending',
            message: `New booking for ${
              typeof booking.properties[0]?.propertyId === 'object'
                ? booking.properties[0]?.propertyId?.title
                : 'Property'
            }`,
            time: booking.createdAt || new Date(),
            amount: booking.properties[0]?.totalPrice || 0,
          }));

          this.recentActivities = activities
            .sort(
              (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
            )
            .slice(0, 5);

          this.unreadCount =
            this.notifications.filter((n) => !n.read).length +
            this.recentActivities.filter((a) => a.type === 'pending').length;
        },
        error: (error) => {
          console.error('Error loading admin activities:', error);
          this.recentActivities = [];
        },
      });
    } else {
      this.recentActivities = [];
    }
  }

  loadUser() {
    const userData = this.loginService.getUserData();
    if (userData) {
      this.userStateService.setUser(userData);
    }

    const token = this.loginService.getToken();
    if (token) {
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const userId = tokenPayload.id;

        if (userId) {
          this.userService.getUserById(userId).subscribe({
            next: (user) => {
              this.userStateService.setUser(user);
              this.loginService.saveUserData(user);
            },
            error: (error) => {
              console.error('Error loading user:', error);
              this.logout();
            },
          });

          this.revenueService.getRevenue().subscribe({
            next: (response: RevenueResponse) => {
              this.getRevenue = response.totalRevenue;
            },
            error: (error: any) => {
              console.error('Error loading revenue:', error);
            },
          });
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        this.logout();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent) {
    if (this.showNotifications) {
      const notificationsElement = this.notificationsContainer?.nativeElement;
      if (
        notificationsElement &&
        !notificationsElement.contains(event.target)
      ) {
        this.showNotifications = false;
      }
    }
  }

  @HostListener('window:scroll')
  public onWindowScroll() {
    if (this.showNotifications) {
      this.showNotifications = false;
    }
  }

  public toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  public markAllAsRead() {
    this.notificationService.markAllAsRead();
    this.unreadCount = 0;
    this.loadNotifications();
  }

  public logout() {
    this.loginService.logout();
    this.userStateService.clearUser();
    this.router.navigate(['/login']);
  }

  public get userName(): string {
    return this.user ? `${this.user.name} ` : 'Guest';
  }

  public get userRole(): string {
    if (!this.user) return 'Guest';
    return this.user.role;
  }

  public get userAvatar(): string {
    return this.user?.avatar || 'assets/images/default-avatar.png';
  }

  public navigateToProfile(): void {
    if (this.user) {
      this.router.navigate(['/profile']);
    }
  }

  public toggleSidebar(): void {
    // Implement sidebar toggle logic
  }

  public toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  public onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery },
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const bookingDate = new Date(date);

    // Format the date
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    return bookingDate.toLocaleString('en-US', options);
  }
}
