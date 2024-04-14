import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from "rxjs";
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseURL = `http://localhost:5000/auth/`;
  token: any = `ECommerce` + localStorage.getItem("token");
  constructor(private _HttpClient: HttpClient, private _Router: Router) {
    this.token = `ECommerce` + localStorage.getItem("token")
  }
  loginWithGmail(data: any): Observable<any> {
    return this._HttpClient.post(this.baseURL + "loginWithGmail", data)
  }

}
