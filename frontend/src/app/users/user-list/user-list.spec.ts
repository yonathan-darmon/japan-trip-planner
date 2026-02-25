import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListComponent } from './user-list';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../../core/services/auth';
import { BehaviorSubject } from 'rxjs';

describe('UserList', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  const mockAuthService = {
    currentUser$: new BehaviorSubject(null)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
