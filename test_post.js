const formData = new FormData();
formData.append("title", "Test Title");
formData.append("abstract", "Test Abstract");
formData.append("speaker_name", "Test Speaker");
formData.append("speaker_bio", "Test Bio");
formData.append("email", "test@test.com");
formData.append("phone", "1234567890");

fetch("http://localhost:3000/api/talks", {
  method: "POST",
  body: formData
}).then(res => res.json()).then(console.log).catch(console.error);
