pub mod contract;
pub mod error;
pub mod msg;
pub mod state;
pub mod zkp_verifier;

#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub extern "C" fn abort(_code: i32) -> ! {
    core::arch::wasm32::unreachable();
}
