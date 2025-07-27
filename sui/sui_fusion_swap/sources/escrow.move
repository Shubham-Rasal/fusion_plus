module sui_fusion_swap::escrow {
    use sui_fusion_swap::locking::Key;

    /// Escrow Abstraction Struct
    public struct Escrow<T: store+key> has store, key {
        id: sui::object::UID,
        depositor_id: address,
        depositor_key: Key,
        recipient_id: address,
        obj: sui_fusion_swap::locking::Locked<T>,
        timelock: u64
    }

    /// Error codes
    const E_DEPOSITOR_MISMATCH: u64 = 1;

    /// Implementation of an escrow constructor
    public fun create_escrow<T:store+key>(
        ctx:&mut TxContext,
        depositor_id: address,
        recipient_id: address,
        obj: T,
        timelock: u64
    ) {
        let (locked, key) = sui_fusion_swap::locking::lock(ctx, obj);
        
        let escrow = Escrow {
            id: sui::object::new(ctx),
            depositor_id,
            depositor_key: key,
            recipient_id,
            obj: locked,
            timelock: timelock
        };

        sui::transfer::transfer(escrow, depositor_id);

        // Emit an event that the escrow has been created
    }

    public fun claim_escrow<T: store+key> (
        ctx: &mut TxContext,
        escrow: Escrow<T>,
        recipient_key: Key
    ): Key{
        let Escrow {
            id: id,
            depositor_id: _depositor_id,
            depositor_key,
            recipient_id,
            obj: locked_obj,
            timelock: _,
        } = escrow;

        assert!(recipient_id == tx_context::sender(ctx), E_DEPOSITOR_MISMATCH);
        assert!(depositor_key == &recipient_key, E_DEPOSITOR_MISMATCH);

        // let current_time = sui::tx_context::epoch_timestamp_ms(_self) // TODO: Change this implementation in the future
        // assert!(current_time >= escrow.timelock, "Funds are still locked");

        
        let obj: T = sui_fusion_swap::locking::unlock(locked_obj, recipient_key);

        // Delete the escrow object
        sui::object::delete(id);

        sui::transfer::public_transfer(obj, recipient_id);

        depositor_key
    }
}