import Header from "../Header/header";
import ContactForm from "./ContactForm";
import Footer from "../Footer/footer";

export default function GetInTouch() {
  return (
    <>
      <Header />
      <main className="py-5">
        <section className="container">
          <h2 className="text-center mb-4">Let’s Connect</h2>
          <p className="text-center text-muted mb-5">
            Whether you have a question, want to collaborate, or just want to say hi — we’re always happy to hear from you.
          </p>
          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
