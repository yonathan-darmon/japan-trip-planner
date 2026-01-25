
# verification_tour.ps1
$baseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "Stop"

function Test-Step {
    param($Name, $Action)
    Write-Host "Testing: $Name..." -NoNewline
    try {
        $result = & $Action
        Write-Host " [OK]" -ForegroundColor Green
        return $result
    }
    catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Yellow
        exit 1
    }
}

# 1. Login
$token = Test-Step "Login (Admin)" {
    $body = @{ username = "admin"; password = "AdminPassword123!" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    return $response.access_token
}

$headers = @{ Authorization = "Bearer $token" }

# 2. List Suggestions
Test-Step "List Suggestions" {
    $list = Invoke-RestMethod -Uri "$baseUrl/suggestions" -Method Get -Headers $headers
    Write-Host " (Found $($list.Count))" -NoNewline
    return $list
}

# 3. Create Suggestion
$newId = Test-Step "Create Suggestion" {
    $body = @{
        name        = "Integration Test Shrine"
        location    = "Tokyo Tower"
        category    = "Temple"
        price       = 0
        description = "Created by verification script"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/suggestions" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    return $response.id
}

# 4. Vote for Suggestion
Test-Step "Vote (Heart)" {
    $body = @{ selected = $true; priority = "SI_POSSIBLE" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/preferences/$newId" -Method Patch -Body $body -ContentType "application/json" -Headers $headers
}

# 5. Get Itinerary Config
Test-Step "Get Trip Config" {
    Invoke-RestMethod -Uri "$baseUrl/trip-config" -Method Get -Headers $headers
}

# 6. Generate Itinerary
Test-Step "Generate Itinerary" {
    $response = Invoke-RestMethod -Uri "$baseUrl/itinerary/generate" -Method Post -Headers $headers
    Write-Host " (Generated ID: $($response.id))" -NoNewline
    return $response
}

# 7. Clean up (Delete Suggestion)
Test-Step "Cleanup (Soft Delete Suggestion)" {
    Invoke-RestMethod -Uri "$baseUrl/suggestions/$newId" -Method Delete -Headers $headers
}

Write-Host "`n✅ Verification Tour Completed Successfully!" -ForegroundColor Cyan
