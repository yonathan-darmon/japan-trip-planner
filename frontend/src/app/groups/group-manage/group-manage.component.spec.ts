import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupManageComponent } from './group-manage.component';
import { GroupsService } from '../../core/services/groups.service';
import { TripConfigService } from '../../core/services/trip-config';
import { AuthService } from '../../core/services/auth';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('GroupManageComponent', () => {
    let component: GroupManageComponent;
    let fixture: ComponentFixture<GroupManageComponent>;
    let mockAuthService: any;
    let mockGroupsService: any;
    let mockTripConfigService: any;

    const mockUser = { id: 1, username: 'test', role: 'user', email: 'test@test.com' };
    const mockGroup = {
        id: 10,
        name: 'Test Group',
        members: [
            { user: { id: 1, username: 'user1', email: 'user1@test.com' }, role: 'member' },
            { user: { id: 2, username: 'admin1', email: 'admin@test.com' }, role: 'admin' }
        ]
    };

    beforeEach(async () => {
        mockAuthService = {
            currentUserValue: mockUser,
            currentUser$: of(mockUser)
        };
        mockGroupsService = {
            getGroup: jasmine.createSpy('getGroup').and.returnValue(of(mockGroup)),
            getMyGroups: jasmine.createSpy('getMyGroups').and.returnValue(of([mockGroup])),
            inviteMember: jasmine.createSpy('inviteMember').and.returnValue(of({})),
            removeMember: jasmine.createSpy('removeMember').and.returnValue(of({}))
        };
        mockTripConfigService = {
            getConfig: jasmine.createSpy('getConfig').and.returnValue(of({})),
            updateConfig: jasmine.createSpy('updateConfig').and.returnValue(of({}))
        };

        await TestBed.configureTestingModule({
            imports: [GroupManageComponent],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: GroupsService, useValue: mockGroupsService },
                { provide: TripConfigService, useValue: mockTripConfigService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '10' } } } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GroupManageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isAdmin should return false for regular member', () => {
        component.group = mockGroup as any;
        mockAuthService.currentUserValue = { id: 1, role: 'user' };
        expect(component.isAdmin()).toBeFalse();
    });

    it('isAdmin should return true for group admin', () => {
        component.group = mockGroup as any;
        mockAuthService.currentUserValue = { id: 2, role: 'user' }; // ID 2 is admin in group
        expect(component.isAdmin()).toBeTrue();
    });

    it('isAdmin should return true for super admin', () => {
        component.group = mockGroup as any;
        mockAuthService.currentUserValue = { id: 99, role: 'super_admin' };
        expect(component.isAdmin()).toBeTrue();
    });

    it('isAdmin should handle string/number ID mismatch', () => {
        component.group = mockGroup as any;
        // Group has user ID 2 as admin (number)
        // Auth service returns ID '2' (string)
        mockAuthService.currentUserValue = { id: '2', role: 'user' };
        expect(component.isAdmin()).toBeTrue();
    });
});
