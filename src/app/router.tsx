import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import { AppLayout } from "@/components/bottom-nav";

const ClientListView = lazy(() =>
  import("@/views/clients/client-list-view").then((m) => ({
    default: m.ClientListView,
  })),
);
const ClientFormView = lazy(() =>
  import("@/views/clients/client-form-view").then((m) => ({
    default: m.ClientFormView,
  })),
);
const ClientProfileView = lazy(() =>
  import("@/views/clients/client-profile-view").then((m) => ({
    default: m.ClientProfileView,
  })),
);
const ClientProgressView = lazy(() =>
  import("@/views/clients/client-progress-view").then((m) => ({
    default: m.ClientProgressView,
  })),
);
const ClientWeightView = lazy(() =>
  import("@/views/clients/client-weight-view").then((m) => ({
    default: m.ClientWeightView,
  })),
);
const ExerciseLibraryView = lazy(() =>
  import("@/views/exercises/exercise-library-view").then((m) => ({
    default: m.ExerciseLibraryView,
  })),
);
const ExerciseFormView = lazy(() =>
  import("@/views/exercises/exercise-form-view").then((m) => ({
    default: m.ExerciseFormView,
  })),
);
const SettingsView = lazy(() =>
  import("@/views/settings/settings-view").then((m) => ({
    default: m.SettingsView,
  })),
);
const SessionFormView = lazy(() =>
  import("@/views/sessions/session-form-view").then((m) => ({
    default: m.SessionFormView,
  })),
);
const PeriodFormView = lazy(() =>
  import("@/views/periods/period-form-view").then((m) => ({
    default: m.PeriodFormView,
  })),
);

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ClientListView />} />
          <Route path="/clients/new" element={<ClientFormView />} />
          <Route path="/clients/:clientId" element={<ClientProfileView />} />
          <Route path="/clients/:clientId/edit" element={<ClientFormView />} />
          <Route
            path="/clients/:clientId/progress"
            element={<ClientProgressView />}
          />
          <Route
            path="/clients/:clientId/weight"
            element={<ClientWeightView />}
          />
          <Route
            path="/clients/:clientId/sessions/new"
            element={<SessionFormView />}
          />
          <Route
            path="/clients/:clientId/sessions/:sessionId"
            element={<SessionFormView />}
          />
          <Route
            path="/clients/:clientId/periods/new"
            element={<PeriodFormView />}
          />
          <Route
            path="/clients/:clientId/periods/:periodId"
            element={<PeriodFormView />}
          />
          <Route path="/exercises" element={<ExerciseLibraryView />} />
          <Route path="/exercises/new" element={<ExerciseFormView />} />
          <Route
            path="/exercises/:exerciseId/edit"
            element={<ExerciseFormView />}
          />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
