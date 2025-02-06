let obj = JSON.parse($response.body);
if (obj.hasOwnProperty("mobileProfile") && typeof obj.mobileProfile === "object") {
    let pro = obj.mobileProfile;
    pro.profileStatus = "PROFILE_AVAILABLE";
    pro.legacyProfile = {};  
    pro.relationshipProfile = [];  
}

$done({ body: JSON.stringify(obj) });
