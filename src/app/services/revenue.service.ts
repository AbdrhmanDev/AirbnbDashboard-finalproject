import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
interface RevenueResponse {
  totalRevenue: number;
}

@Injectable({
  providedIn: 'root',
})
export class RevenueService {
  // private apiUrl = 'http://localhost:3000/bookings'; // Replace with actual API URL
  private apiUrl =
    'https://fundamental-amitie-ahmedkamal-a550a1ad.koyeb.app/bookings'; // Replace with actual API URL

  constructor(private http: HttpClient) {}
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token'); // Retrieve the token from localStorage
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Add the token to the Authorization header
    });
  }
  getRevenue(): Observable<RevenueResponse> {
    return this.http.get<RevenueResponse>(`${this.apiUrl}/getRevenue`, {
      headers: this.getAuthHeaders(),
    });
  }
}
