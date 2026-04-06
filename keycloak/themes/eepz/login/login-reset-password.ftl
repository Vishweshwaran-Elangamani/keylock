<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
  <#if section == "header">
    Reset your password
  <#elseif section == "info">
    <p>Enter your email address and we’ll send reset instructions.</p>
  <#elseif section == "form">
    <form action="${url.loginAction}" method="post">

      <div class="kc-form-group">
        <label for="username" class="kc-label">Email Address</label>
        <input type="text"
               id="username"
               name="username"
               class="kc-input"
               autofocus
               value="${(username!'')}"/>
      </div>

      <div class="kc-form-group">
        <input type="submit"
               class="kc-button kc-button-primary"
               value="Send Reset Link"/>
      </div>
    </form>

    <!-- ✅ Custom Back To Login -->
    <div class="eepz-back-link">
      <a href="http://localhost:3007/login">
        ← Back to Login
      </a>
    </div>
  </#if>
</@layout.registrationLayout>
``