import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Simulators from "@/pages/Simulators";
import Lessons from "@/pages/Lessons";
import Memberships from "@/pages/Memberships";
import MembershipCheckout from "@/pages/MembershipCheckout";
import Programs from "@/pages/Programs";
import ProgramCheckout from "@/pages/ProgramCheckout";
import Events from "@/pages/Events";
import Visit from "@/pages/Visit";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import MiniMulligans from "@/pages/programs/MiniMulligans";
import SummerWomens from "@/pages/programs/SummerWomens";
import SummerSeniors from "@/pages/programs/SummerSeniors";
import ProgramBySlug from "@/pages/programs/ProgramBySlug";
import Book from "@/pages/Book";
import League from "@/pages/League";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminLeague from "@/pages/admin/AdminLeague";
import AdminPrograms from "@/pages/admin/AdminPrograms";
import AdminCoaches from "@/pages/admin/AdminCoaches";
import AdminSubmissions from "@/pages/admin/AdminSubmissions";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin routes — no public Layout, own AdminLayout with sidebar */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="league" element={<AdminLeague />} />
          <Route path="programs" element={<AdminPrograms />} />
          <Route path="coaches" element={<AdminCoaches />} />
          <Route path="submissions" element={<AdminSubmissions />} />
        </Route>
        {/* Public site */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/simulators" element={<Simulators />} />
                <Route path="/lessons" element={<Lessons />} />
                <Route path="/memberships" element={<Memberships />} />
                <Route path="/memberships/checkout" element={<MembershipCheckout />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/programs/checkout" element={<ProgramCheckout />} />
                <Route path="/programs/mini-mulligans" element={<MiniMulligans />} />
                <Route path="/programs/summer-womens" element={<SummerWomens />} />
                <Route path="/programs/summer-seniors" element={<SummerSeniors />} />
                <Route path="/programs/:slug" element={<ProgramBySlug />} />
                <Route path="/league" element={<League />} />
                <Route path="/events" element={<Events />} />
                <Route path="/visit" element={<Visit />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/book" element={<Book />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </>
  );
}
