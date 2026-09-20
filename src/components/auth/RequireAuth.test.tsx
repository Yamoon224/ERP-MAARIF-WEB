import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuthStore } from "@/lib/auth/store";
import { mockRouter } from "@/test/mocks/navigation";

function signIn(actorType: "staff" | "parent") {
  useAuthStore.getState().setSession("token", actorType, { id: "1" } as never);
}

describe("RequireAuth", () => {
  it("shows the protected content to a session of the right type", async () => {
    signIn("staff");
    render(
      <RequireAuth actorType="staff" redirectTo="/connexion">
        <p>Contenu protégé</p>
      </RequireAuth>,
    );

    expect(await screen.findByText("Contenu protégé")).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("sends a visitor without session to the login page", async () => {
    render(
      <RequireAuth actorType="staff" redirectTo="/connexion">
        <p>Contenu protégé</p>
      </RequireAuth>,
    );

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/connexion"));
    expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
  });

  it("does not let a parent session into the staff area", async () => {
    signIn("parent");
    render(
      <RequireAuth actorType="staff" redirectTo="/connexion">
        <p>Contenu protégé</p>
      </RequireAuth>,
    );

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/connexion"));
  });

  it("keeps a signed-in user on the page when the page is reloaded", async () => {
    // Rechargement : le serveur rend "Chargement...", puis le client s'hydrate. Pendant l'hydratation
    // zustand ne montre que l'état initial (sans jeton) ; la session déjà stockée ne doit pas être ignorée.
    const tree = (
      <RequireAuth actorType="staff" redirectTo="/connexion">
        <p>Contenu protégé</p>
      </RequireAuth>
    );
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(tree);
    signIn("staff");

    await act(async () => {
      hydrateRoot(container, tree);
    });

    await waitFor(() => expect(container).toHaveTextContent("Contenu protégé"));
    expect(mockRouter.replace).not.toHaveBeenCalled();
    container.remove();
  });
});
