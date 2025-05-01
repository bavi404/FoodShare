import '../css/ContactForm.css';

export default function ContactForm() {
  return (
    <>
      <div className="formbold-main-wrapper">
        <h1>Contact Us</h1>
        <p className="mb-4 text-muted">We’d love to hear from you. Reach out with questions, suggestions, or just to say hello!</p>

        <div className="formbold-form-wrapper">
          <form>
            <div className="formbold-input-flex">
              <div>
                <input
                  type="text"
                  name="firstname"
                  id="firstname"
                  placeholder="First Name"
                  className="formbold-form-input"
                />
                <label htmlFor="firstname" className="formbold-form-label">First Name</label>
              </div>
              <div>
                <input
                  type="text"
                  name="lastname"
                  id="lastname"
                  placeholder="Last Name"
                  className="formbold-form-input"
                />
                <label htmlFor="lastname" className="formbold-form-label">Last Name</label>
              </div>
            </div>

            <div className="formbold-input-flex">
              <div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="you@example.com"
                  className="formbold-form-input"
                />
                <label htmlFor="email" className="formbold-form-label">Email</label>
              </div>
              <div>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  placeholder="Your phone number"
                  className="formbold-form-input"
                />
                <label htmlFor="phone" className="formbold-form-label">Phone</label>
              </div>
            </div>

            <div className="formbold-textarea">
              <textarea
                rows="6"
                name="message"
                id="message"
                placeholder="Tell us how we can help you..."
                className="formbold-form-input"
              ></textarea>
              <label htmlFor="message" className="formbold-form-label">Your Message</label>
            </div>

            <a href="/" className="formbold-btn">Send Message</a>
          </form>
        </div>
      </div>
    </>
  );
}
