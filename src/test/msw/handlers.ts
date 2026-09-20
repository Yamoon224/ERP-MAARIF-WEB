import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:8000/api";

export const handlers = [
  http.post(`${API_URL}/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === "admin@maarif.test" && body.password === "password") {
      return HttpResponse.json({
        data: {
          token: "fake-staff-token",
          user: {
            id: "1",
            name: "Admin Maarif",
            email: "admin@maarif.test",
            phone: null,
            type: "staff",
            roles: ["admin"],
            permissions: ["students.view", "students.manage"],
          },
        },
      });
    }

    return HttpResponse.json(
      { message: "Identifiants invalides.", error_code: "validation_failed", errors: { email: ["Identifiants invalides."] } },
      { status: 422 },
    );
  }),

  http.post(`${API_URL}/parent/login`, async ({ request }) => {
    const body = (await request.json()) as { matricule: string; password: string };

    if (body.matricule === "MAA-2026-000001" && body.password === "password") {
      return HttpResponse.json({
        data: {
          token: "fake-parent-token",
          student: {
            id: "10",
            matricule: "MAA-2026-000001",
            first_name: "Fatoumata",
            last_name: "Camara",
            type: "parent",
            school_class: { id: "5", name: "6eme A" },
          },
        },
      });
    }

    return HttpResponse.json(
      { message: "Matricule ou mot de passe incorrect.", error_code: "validation_failed", errors: { matricule: ["Matricule ou mot de passe incorrect."] } },
      { status: 422 },
    );
  }),

  http.get(`${API_URL}/students`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    const allStudents = [
      { id: "1", matricule: "MAA-2026-000001", first_name: "Fatoumata", last_name: "Camara", gender: "F", birth_date: null, school_class: { id: "5", name: "6eme A", level: "6eme" }, guardian_name: "Ibrahima Camara", guardian_phone: "+224600000000", guardian_email: null, address: null, is_active: true },
      { id: "2", matricule: "MAA-2026-000002", first_name: "Moussa", last_name: "Diallo", gender: "M", birth_date: null, school_class: { id: "5", name: "6eme A", level: "6eme" }, guardian_name: "Aissatou Diallo", guardian_phone: "+224600000001", guardian_email: null, address: null, is_active: true },
    ];

    const filtered = search
      ? allStudents.filter((student) => `${student.first_name} ${student.last_name}`.toLowerCase().includes(search.toLowerCase()))
      : allStudents;

    return HttpResponse.json({
      data: filtered,
      meta: { current_page: 1, last_page: 1, per_page: 15, total: filtered.length },
    });
  }),
];
