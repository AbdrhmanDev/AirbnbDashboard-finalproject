import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Hotel } from '../models/hotel';
import { Hotel2 } from '../models/hoteln';

@Injectable({
  providedIn: 'root',
})
export class HotelsService {
  // private apiUrl = 'http://localhost:3000/Hotel'; // Replace with actual API URL
  private apiUrl =
    'https://fundamental-amitie-ahmedkamal-a550a1ad.koyeb.app/Hotel'; // Replace with actual API URL

  constructor(private http: HttpClient) {}
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token'); // Retrieve the token from localStorage
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Add the token to the Authorization header
    });
  }
  getHotels(): Observable<Hotel2[]> {
    return this.http.get<Hotel2[]>(`${this.apiUrl}/hostHotel`, {
      headers: this.getAuthHeaders(),
    });
  }
  deleteHotel(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}`; // Construct the URL for the specific hotel
    return this.http
      .delete<any>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  getHotelById(id: string): Observable<Hotel2> {
    return this.http.get<Hotel2>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
  createHotel(hotel: Hotel2): Observable<Hotel2> {
    return this.http.post<Hotel2>(this.apiUrl, hotel, {
      headers: this.getAuthHeaders(),
    });
  }
  updateHotel(id: string, hotel: Hotel2): Observable<Hotel2> {
    const url = `${this.apiUrl}/${id}`; // Construct the URL for the specific hotel
    return this.http
      .patch<Hotel2>(url, hotel, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
